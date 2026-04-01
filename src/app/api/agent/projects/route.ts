import { getDb } from '@/db';
import { project } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  if (!body.title || typeof body.title !== 'string') {
    return apiError("'title' is required (string)", 400);
  }
  if (body.title.length > 200) {
    return apiError("'title' must be at most 200 characters", 400);
  }

  const id = nanoid();
  const db = await getDb();
  const [created] = await db
    .insert(project)
    .values({
      id,
      userId: user.userId,
      title: body.title,
      metadata: (body.metadata as Record<string, unknown>) ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: project.id,
      title: project.title,
      status: project.status,
      metadata: project.metadata,
      createdAt: project.createdAt,
    });

  return apiSuccess(created);
}
