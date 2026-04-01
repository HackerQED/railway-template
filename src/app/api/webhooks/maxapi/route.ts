import {
  confirmCreditsDeduction,
  rollbackLockedCredits,
} from '@/credits/credits';
import { getDb } from '@/db';
import { generation, userConversion } from '@/db/schema';
import type { TransferOptions } from '@/worker/utils/transfer-to-r2';
import { transferUrlsToR2 } from '@/worker/utils/transfer-to-r2';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * MaxAPI webhook payload shape (from docs.maxapi.io/api-reference/webhook)
 */
interface MaxApiWebhookPayload {
  code: number;
  data: {
    taskId: string;
    status: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'CANCELLED';
    input: Record<string, unknown>;
    result: { type: string; urls: string[] } | null;
    failure_reason: string | null;
    created_at: string;
    updated_at: string;
  };
}

async function shouldAddWatermark(userId: string): Promise<boolean> {
  const db = await getDb();
  const [conv] = await db
    .select({ purchaseAt: userConversion.purchaseAt })
    .from(userConversion)
    .where(eq(userConversion.userId, userId))
    .limit(1);
  return !conv?.purchaseAt;
}

export async function POST(req: Request): Promise<NextResponse> {
  let payload: MaxApiWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { taskId, status, result, failure_reason } = payload.data;
  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
  }

  console.log(`[webhook/maxapi] Received: taskId=${taskId} status=${status}`);

  const db = await getDb();

  // Find the generation record by upstream task ID
  const [gen] = await db
    .select({
      id: generation.id,
      status: generation.status,
      userId: generation.userId,
      type: generation.type,
    })
    .from(generation)
    .where(eq(generation.innerProviderTaskId, taskId))
    .limit(1);

  if (!gen) {
    console.warn(`[webhook/maxapi] Unknown taskId: ${taskId}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Ignore if already in terminal state (idempotency)
  if (gen.status === 'done' || gen.status === 'failed') {
    console.log(
      `[webhook/maxapi] Generation ${gen.id} already ${gen.status}, skipping`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (status === 'SUCCESS' && result?.urls?.length) {
    // Determine watermark for unpaid users
    const needsWatermark = await shouldAddWatermark(gen.userId);
    const transferOpts: TransferOptions | undefined = needsWatermark
      ? { addWatermark: true, contentType: gen.type as 'image' | 'video' }
      : undefined;

    const urls = await transferUrlsToR2(result.urls, transferOpts);
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
        `[webhook/maxapi] Failed to confirm credits for ${gen.id}:`,
        err
      );
    }

    console.log(
      `[webhook/maxapi] Generation ${gen.id} done${needsWatermark ? ' (watermarked)' : ''}: ${url.slice(0, 80)}...`
    );
  } else {
    // FAILURE, TIMEOUT, CANCELLED
    await db
      .update(generation)
      .set({
        status: 'failed',
        error: {
          code: failure_reason || status,
          message: failure_reason
            ? `Generation failed: ${failure_reason}`
            : `Generation ${status.toLowerCase()}`,
        },
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(generation.id, gen.id));

    try {
      await rollbackLockedCredits({ generationId: gen.id });
    } catch (err) {
      console.error(
        `[webhook/maxapi] Failed to rollback credits for ${gen.id}:`,
        err
      );
    }

    console.log(
      `[webhook/maxapi] Generation ${gen.id} failed: ${failure_reason || status}`
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
