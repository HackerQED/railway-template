import { MODELS_MAP } from '@/config/models';
import { checkCreditsAvailable, lockCredits } from '@/credits/credits';
import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import { getAdapter } from '@/worker/registry';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { getHandler } from './handlers';
import type { ModelHandler, SubmitResult } from './handlers/types';

async function executeSubmit(
  handler: ModelHandler,
  modelId: string,
  item: Record<string, unknown>,
  index: number,
  userId: string
): Promise<{ task_id: string; index: number } | { error: string; index: number }> {
  const config = MODELS_MAP.get(modelId)!;
  const creditCost = handler.resolveCost(config, item);

  try {
    const genId = nanoid();
    const result: SubmitResult = await handler.submit(item, index);

    const adapter = getAdapter(result.adapterName);
    const { taskId } = await adapter.submit(result.adapterInput);

    const db = await getDb();
    await db.insert(generation).values({
      id: genId,
      userId,
      type: result.generationType,
      generatorId: modelId,
      innerProvider: result.adapterName,
      innerModelId: result.innerModelId,
      innerProviderTaskId: taskId,
      status: 'pending',
      input: result.dbInput,
      comment: (item.comment as string) || null,
      sortOrder: index,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await lockCredits({
      userId,
      amount: creditCost,
      generationId: genId,
      description: `${result.creditDescription}: ${creditCost} credits`,
    });

    return { task_id: genId, index };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: sanitizeErrorMessage(msg), index };
  }
}

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  // Resolve model
  const modelId = body.model as string;
  if (!modelId) return apiError("'model' is required", 400);

  const modelConfig = MODELS_MAP.get(modelId);
  if (!modelConfig) return apiError(`Unknown model: ${modelId}`, 400);

  const handler = getHandler(modelId);
  if (!handler) return apiError(`No handler for model: ${modelId}`, 400);

  // Batch mode
  if (Array.isArray(body.items)) {
    let items = body.items as Record<string, unknown>[];
    if (items.length === 0) return apiError("'items' array must not be empty", 400);
    if (items.length > 20) return apiError("'items' array must have at most 20 entries", 400);

    if (handler.normalize) {
      items = items.map((it) => handler.normalize!(it));
    }

    for (let i = 0; i < items.length; i++) {
      const err = handler.validate(items[i], `items[${i}].`);
      if (err) return apiError(err, 400);
    }

    const totalCredits = items.reduce(
      (sum, it) => sum + handler.resolveCost(modelConfig, it),
      0
    );
    const hasCredits = await checkCreditsAvailable({
      userId: user.userId,
      requiredCredits: totalCredits,
    });
    if (!hasCredits) return apiError('Insufficient credits', 402);

    const results = await Promise.all(
      items.map((item, i) => executeSubmit(handler, modelId, item, i, user.userId))
    );

    return apiSuccess({ tasks: results });
  }

  // Single mode — extract item from body (exclude 'model' and 'items')
  const { model: _model, items: _items, ...itemFields } = body;
  let item: Record<string, unknown> = itemFields;

  if (handler.normalize) {
    item = handler.normalize(item);
  }

  const err = handler.validate(item, '');
  if (err) return apiError(err, 400);

  const creditCost = handler.resolveCost(modelConfig, item);
  const hasCredits = await checkCreditsAvailable({
    userId: user.userId,
    requiredCredits: creditCost,
  });
  if (!hasCredits) return apiError('Insufficient credits', 402);

  const result = await executeSubmit(handler, modelId, item, 0, user.userId);

  if ('error' in result) return apiError(result.error, 500);
  return apiSuccess({ task_id: result.task_id });
}
