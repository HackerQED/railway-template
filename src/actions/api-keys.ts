'use server';

import { getDb } from '@/db';
import { apiKey } from '@/db/schema';
import { generateApiKey } from '@/lib/api-auth';
import type { User } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

/**
 * List all API keys for the current user (non-revoked)
 */
export const listApiKeysAction = userActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const currentUser = (ctx as { user: User }).user;
    const db = await getDb();

    const keys = await db
      .select({
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
      })
      .from(apiKey)
      .where(and(eq(apiKey.userId, currentUser.id), isNull(apiKey.revokedAt)))
      .orderBy(desc(apiKey.createdAt));

    return { success: true, data: keys };
  });

/**
 * Create a new API key
 */
export const createApiKeyAction = userActionClient
  .schema(
    z.object({
      name: z
        .string()
        .min(1, 'Name is required')
        .max(64, 'Name must be 64 characters or less'),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const currentUser = (ctx as { user: User }).user;
    const { key, id } = await generateApiKey(currentUser.id, parsedInput.name);

    return {
      success: true,
      data: { key, id },
    };
  });

/**
 * Revoke an API key
 */
export const revokeApiKeyAction = userActionClient
  .schema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    const currentUser = (ctx as { user: User }).user;
    const db = await getDb();

    const [updated] = await db
      .update(apiKey)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(apiKey.id, parsedInput.id),
          eq(apiKey.userId, currentUser.id),
          isNull(apiKey.revokedAt)
        )
      )
      .returning({ id: apiKey.id });

    if (!updated) {
      return { success: false, error: 'API key not found' };
    }

    return { success: true };
  });
