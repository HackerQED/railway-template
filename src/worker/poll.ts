import {
  confirmCreditsDeduction,
  rollbackLockedCredits,
} from '@/credits/credits';
import { getDb } from '@/db';
import { generation, userConversion } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getAdapter } from './registry';
import type { PollResult } from './types';
import { WEBHOOK_PROVIDERS } from './types';
import type { TransferOptions } from './utils/transfer-to-r2';
import { transferUrlsToR2 } from './utils/transfer-to-r2';

const POLL_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours — polling-based providers
const WEBHOOK_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours — webhook-based providers (safety net for lost webhooks)

/**
 * Check if user has never purchased — unpaid users get watermarks.
 */
async function shouldAddWatermark(userId: string): Promise<boolean> {
  const db = await getDb();
  const [conv] = await db
    .select({ purchaseAt: userConversion.purchaseAt })
    .from(userConversion)
    .where(eq(userConversion.userId, userId))
    .limit(1);
  return !conv?.purchaseAt;
}

export async function pollOnce() {
  const db = await getDb();

  const tasks = await db
    .select()
    .from(generation)
    .where(inArray(generation.status, ['pending', 'processing']));

  if (tasks.length === 0) return;

  const webhookTasks = tasks.filter((gen) =>
    WEBHOOK_PROVIDERS.has(gen.innerProvider as any)
  );
  const pollableTasks = tasks.filter(
    (gen) => !WEBHOOK_PROVIDERS.has(gen.innerProvider as any)
  );

  // Timeout stale webhook tasks (safety net — webhooks can be lost)
  for (const gen of webhookTasks) {
    const age = Date.now() - new Date(gen.createdAt).getTime();
    if (age > WEBHOOK_TIMEOUT_MS) {
      console.warn(
        `[poll] Webhook generation ${gen.id} (${gen.innerProvider}) stale for ${Math.round(age / 3600000)}h, marking failed`
      );
      await db
        .update(generation)
        .set({
          status: 'failed',
          error: {
            code: 'WEBHOOK_TIMEOUT',
            message: 'Generation did not receive a callback within 24 hours',
          },
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(generation.id, gen.id));

      try {
        await rollbackLockedCredits({ generationId: gen.id });
      } catch (err) {
        console.error(`[poll] Failed to rollback credits for ${gen.id}:`, err);
      }
    }
  }

  if (pollableTasks.length === 0) return;

  console.log(`[poll] Found ${pollableTasks.length} active generation(s)`);

  await Promise.all(
    pollableTasks.map(async (gen) => {
      try {
        if (!gen.innerProviderTaskId) return;

        const adapter = getAdapter(gen.innerProvider);
        const result: PollResult = await adapter.poll(gen.innerProviderTaskId);

        if (result.status === 'done') {
          // Determine watermark for unpaid users
          const needsWatermark = await shouldAddWatermark(gen.userId);
          const transferOpts: TransferOptions | undefined = needsWatermark
            ? { addWatermark: true, contentType: gen.type as 'image' | 'video' }
            : undefined;

          const urls = await transferUrlsToR2(result.output.urls, transferOpts);
          const url = urls[0] || '';
          await db
            .update(generation)
            .set({
              status: 'done',
              output: { url, urls },
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(generation.id, gen.id));

          try {
            await confirmCreditsDeduction({ generationId: gen.id });
          } catch (err) {
            console.error(
              `[poll] Failed to confirm credits for ${gen.id}:`,
              err
            );
          }

          console.log(
            `[poll] Generation ${gen.id} done${needsWatermark ? ' (watermarked)' : ''}: ${url.slice(0, 80)}...`
          );
        } else if (result.status === 'failed') {
          await db
            .update(generation)
            .set({
              status: 'failed',
              error: result.error,
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(generation.id, gen.id));

          try {
            await rollbackLockedCredits({ generationId: gen.id });
          } catch (err) {
            console.error(
              `[poll] Failed to rollback credits for ${gen.id}:`,
              err
            );
          }

          console.log(
            `[poll] Generation ${gen.id} failed: ${result.error.message}`
          );
        } else if (result.status === 'processing' && gen.status === 'pending') {
          await db
            .update(generation)
            .set({
              status: 'processing',
              startedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(generation.id, gen.id));
        } else if (
          (result.status === 'pending' || result.status === 'processing') &&
          Date.now() - new Date(gen.createdAt).getTime() > POLL_TIMEOUT_MS
        ) {
          // Timeout only if upstream is still pending/processing
          console.warn(
            `[poll] Generation ${gen.id} timed out (${Math.round((Date.now() - new Date(gen.createdAt).getTime()) / 60000)}min), upstream still ${result.status}`
          );
          await db
            .update(generation)
            .set({
              status: 'failed',
              error: {
                code: 'TIMEOUT',
                message: `Generation timed out after 2 hours (upstream: ${result.status})`,
              },
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(generation.id, gen.id));

          try {
            await rollbackLockedCredits({ generationId: gen.id });
          } catch (err) {
            console.error(
              `[poll] Failed to rollback credits for ${gen.id}:`,
              err
            );
          }
        }
      } catch (err) {
        console.error(`[poll] Error processing generation ${gen.id}:`, err);
      }
    })
  );
}
