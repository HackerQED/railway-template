import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { getDb } from '@/db';
import { apiKey } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { requireSession } from './require-session';

export interface ApiUser {
  userId: string;
  method: 'session' | 'apikey';
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Resolve user identity from request.
 * Checks Authorization: Bearer <key> first, then falls back to session cookie.
 */
export async function resolveApiUser(
  request: NextRequest
): Promise<ApiUser | null> {
  // 1. Try API key
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7).trim();
    if (key) {
      const db = await getDb();
      const keyHash = hashKey(key);
      const [row] = await db
        .select({ userId: apiKey.userId, id: apiKey.id })
        .from(apiKey)
        .where(and(eq(apiKey.keyHash, keyHash), isNull(apiKey.revokedAt)))
        .limit(1);

      if (row) {
        // Fire-and-forget: update lastUsedAt
        db.update(apiKey)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKey.id, row.id))
          .catch((e) =>
            console.error('[api-auth] lastUsedAt update failed:', e)
          );
        return { userId: row.userId, method: 'apikey' };
      }
    }
  }

  // 2. Fallback to session cookie
  const session = await requireSession(request);
  if (session) {
    return { userId: session.user.id, method: 'session' };
  }

  return null;
}

/**
 * Generate a new API key for a user. Returns the plaintext key (only shown once).
 */
export async function generateApiKey(
  userId: string,
  name: string
): Promise<{ key: string; id: string }> {
  const raw = randomBytes(24).toString('base64url');
  const key = `rwtpl_${raw}`;
  const keyHash = hashKey(key);
  const keyPrefix = key.slice(0, 12);
  const id = nanoid();

  const db = await getDb();
  await db.insert(apiKey).values({
    id,
    userId,
    keyHash,
    keyPrefix,
    name,
    createdAt: new Date(),
  });

  return { key, id };
}
