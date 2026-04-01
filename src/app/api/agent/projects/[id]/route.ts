import { getDb } from '@/db';
import { generation, project } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeError } from '@/lib/sanitize-error';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

const VALID_STATUSES = ['active', 'completed', 'archived'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized();

  const { id } = await params;
  const db = await getDb();

  const [proj] = await db
    .select({
      id: project.id,
      title: project.title,
      status: project.status,
      metadata: project.metadata,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
    .from(project)
    .where(and(eq(project.id, id), eq(project.userId, user.userId)));

  if (!proj) {
    return apiError('Project not found', 404);
  }

  const generations = await db
    .select({
      id: generation.id,
      type: generation.type,
      status: generation.status,
      comment: generation.comment,
      output: generation.output,
      error: generation.error,
      sortOrder: generation.sortOrder,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt,
    })
    .from(generation)
    .where(eq(generation.projectId, id));

  const sanitizedGenerations = generations.map((g) => ({
    ...g,
    error: g.error ? sanitizeError(g.error) : null,
  }));

  return apiSuccess({ ...proj, generations: sanitizedGenerations });
}

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

  if ('title' in body) {
    if (typeof body.title !== 'string' || !body.title) {
      return apiError("'title' must be a non-empty string", 400);
    }
    if (body.title.length > 200) {
      return apiError("'title' must be at most 200 characters", 400);
    }
    updates.title = body.title;
  }

  if ('status' in body) {
    if (!VALID_STATUSES.includes(body.status as string)) {
      return apiError(
        `'status' must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }
    updates.status = body.status;
  }

  if ('metadata' in body) {
    updates.metadata = body.metadata ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return apiError(
      'No valid fields to update. Supported: title, status, metadata',
      400
    );
  }

  updates.updatedAt = new Date();

  const db = await getDb();
  const result = await db
    .update(project)
    .set(updates)
    .where(and(eq(project.id, id), eq(project.userId, user.userId)))
    .returning({
      id: project.id,
      title: project.title,
      status: project.status,
      metadata: project.metadata,
      updatedAt: project.updatedAt,
    });

  if (result.length === 0) {
    return apiError('Project not found', 404);
  }

  return apiSuccess(result[0]);
}
