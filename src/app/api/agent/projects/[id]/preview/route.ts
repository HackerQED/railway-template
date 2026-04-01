import { getDb } from '@/db';
import { preview, project } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import type { Block, BlockUpdate } from '@/lib/preview-blocks';
import {
  applyBlockUpdates,
  validateBlocks,
  validateUpdateItems,
} from '@/lib/preview-blocks';
import { getBaseUrl } from '@/lib/urls/urls';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';

async function verifyProjectOwnership(projectId: string, userId: string) {
  const db = await getDb();
  const [proj] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)));
  return !!proj;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized();

  const { id: projectId } = await params;

  if (!(await verifyProjectOwnership(projectId, user.userId))) {
    return apiError('Project not found', 404);
  }

  const db = await getDb();
  const [existing] = await db
    .select({
      id: preview.id,
      blocks: preview.blocks,
      createdAt: preview.createdAt,
      updatedAt: preview.updatedAt,
    })
    .from(preview)
    .where(eq(preview.projectId, projectId));

  if (!existing) {
    return apiError('Preview not found', 404);
  }

  const previewUrl = `${getBaseUrl()}/projects/${projectId}`;

  return apiSuccess({
    ...existing,
    preview_url: previewUrl,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized();

  const { id: projectId } = await params;

  if (!(await verifyProjectOwnership(projectId, user.userId))) {
    return apiError('Project not found', 404);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const blocksError = validateBlocks(body.blocks);
  if (blocksError) {
    return apiError(blocksError, 400);
  }

  const db = await getDb();
  const now = new Date();

  // Upsert: create or replace
  const [existing] = await db
    .select({ id: preview.id })
    .from(preview)
    .where(eq(preview.projectId, projectId));

  if (existing) {
    await db
      .update(preview)
      .set({ blocks: body.blocks, updatedAt: now })
      .where(eq(preview.id, existing.id));
  } else {
    await db.insert(preview).values({
      id: nanoid(),
      projectId,
      blocks: body.blocks,
      createdAt: now,
      updatedAt: now,
    });
  }

  const previewUrl = `${getBaseUrl()}/projects/${projectId}`;

  return apiSuccess({
    preview_url: previewUrl,
    blocks: body.blocks,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized();

  const { id: projectId } = await params;

  if (!(await verifyProjectOwnership(projectId, user.userId))) {
    return apiError('Project not found', 404);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const { append, update } = body;

  if (!append && !update) {
    return apiError("At least one of 'append' or 'update' is required", 400);
  }

  // Validate append
  if (append) {
    const appendErr = validateBlocks(append);
    if (appendErr) {
      return apiError(appendErr.replace(/^'blocks'/, "'append'"), 400);
    }
  }

  // Validate update
  if (update) {
    const updateErr = validateUpdateItems(update);
    if (updateErr) {
      return apiError(updateErr, 400);
    }
  }

  const db = await getDb();
  const now = new Date();

  const [existing] = await db
    .select({ id: preview.id, blocks: preview.blocks })
    .from(preview)
    .where(eq(preview.projectId, projectId));

  let newBlocks = existing ? (existing.blocks as Block[]) : [];

  // Apply updates first (on existing blocks)
  if (update && newBlocks.length > 0) {
    const result = applyBlockUpdates(newBlocks, update as BlockUpdate[]);
    if (result.notFound.length > 0) {
      return apiError(`Block(s) not found: ${result.notFound.join(', ')}`, 400);
    }
    newBlocks = result.blocks;
  } else if (update && newBlocks.length === 0) {
    return apiError(
      'Cannot update blocks: preview has no existing blocks',
      400
    );
  }

  // Then append
  if (append) {
    newBlocks = [...newBlocks, ...(append as Block[])];
  }

  if (existing) {
    await db
      .update(preview)
      .set({ blocks: newBlocks, updatedAt: now })
      .where(eq(preview.id, existing.id));
  } else {
    await db.insert(preview).values({
      id: nanoid(),
      projectId,
      blocks: newBlocks,
      createdAt: now,
      updatedAt: now,
    });
  }

  const previewUrl = `${getBaseUrl()}/projects/${projectId}`;

  return apiSuccess({
    preview_url: previewUrl,
    blocks: newBlocks,
  });
}
