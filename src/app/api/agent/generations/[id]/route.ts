import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized();

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const updates: Record<string, unknown> = {};

  if ('comment' in body) {
    if (body.comment !== null && typeof body.comment !== 'string') {
      return apiError("'comment' must be a string or null", 400);
    }
    if (typeof body.comment === 'string' && body.comment.length > 100) {
      return apiError("'comment' must be at most 100 characters", 400);
    }
    updates.comment = body.comment ?? null;
  }

  if ('project_id' in body) {
    if (body.project_id !== null && typeof body.project_id !== 'string') {
      return apiError("'project_id' must be a string or null", 400);
    }
    updates.projectId = body.project_id ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return apiError(
      'No valid fields to update. Supported: comment, project_id',
      400
    );
  }

  updates.updatedAt = new Date();

  const db = await getDb();
  const result = await db
    .update(generation)
    .set(updates)
    .where(and(eq(generation.id, id), eq(generation.userId, user.userId)))
    .returning({
      id: generation.id,
      comment: generation.comment,
      projectId: generation.projectId,
      updatedAt: generation.updatedAt,
    });

  if (result.length === 0) {
    return apiError('Generation not found', 404);
  }

  return apiSuccess(result[0]);
}
