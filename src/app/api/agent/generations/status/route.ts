import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { getDoc } from '@/lib/api-capabilities';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeError } from '@/lib/sanitize-error';
import { and, eq, inArray } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

const DOC = getDoc('/api/agent/generations/status');

const SELECT_FIELDS = {
  id: generation.id,
  type: generation.type,
  status: generation.status,
  comment: generation.comment,
  output: generation.output,
  error: generation.error,
  sortOrder: generation.sortOrder,
  createdAt: generation.createdAt,
  completedAt: generation.completedAt,
};

export async function GET(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized(DOC);

  const idsParam = request.nextUrl.searchParams.get('ids');
  const projectId = request.nextUrl.searchParams.get('project_id');

  if (!idsParam && !projectId) {
    return apiError(
      "missing required query parameter: 'ids' (comma-separated generation IDs) or 'project_id'",
      400,
      DOC
    );
  }

  const db = await getDb();
  let results;

  if (projectId) {
    results = await db
      .select(SELECT_FIELDS)
      .from(generation)
      .where(
        and(
          eq(generation.projectId, projectId),
          eq(generation.userId, user.userId)
        )
      );
  } else {
    const ids = idsParam!
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      return apiError(
        "'ids' must contain at least one generation ID",
        400,
        DOC
      );
    }
    if (ids.length > 100) {
      return apiError(
        "'ids' must contain at most 100 generation IDs",
        400,
        DOC
      );
    }

    results = await db
      .select(SELECT_FIELDS)
      .from(generation)
      .where(
        and(inArray(generation.id, ids), eq(generation.userId, user.userId))
      );
  }

  const sanitized = results.map((t) => ({
    ...t,
    error: t.error ? sanitizeError(t.error) : null,
  }));

  return apiSuccess({ generations: sanitized }, DOC);
}
