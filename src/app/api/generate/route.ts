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
import { z } from 'zod';
import { getHandler } from './handlers';
import { getInputSchema } from './handlers/schemas';
import type { ModelHandler, SubmitResult } from './handlers/types';

/** Top-level request body schema (single mode) */
const singleRequestSchema = z.object({
  model: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
});

/** Top-level request body schema (batch mode) */
const batchRequestSchema = z.object({
  model: z.string().min(1),
  items: z.array(z.record(z.string(), z.unknown())).min(1).max(20),
});

const requestSchema = z.union([batchRequestSchema, singleRequestSchema]);

function formatZodError(err: z.ZodError, prefix = ''): string {
  const first = err.issues[0];
  const path = first.path.length
    ? `${prefix}${first.path.join('.')}`
    : prefix.replace(/\.$/, '');
  return path ? `${path}: ${first.message}` : first.message;
}

async function executeSubmit(
  handler: ModelHandler,
  modelId: string,
  input: Record<string, unknown>,
  index: number,
  userId: string
): Promise<
  { task_id: string; index: number } | { error: string; index: number }
> {
  const config = MODELS_MAP.get(modelId)!;
  const creditCost = handler.resolveCost(config, input);

  try {
    const genId = nanoid();
    const result: SubmitResult = await handler.submit(input, index);

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
      comment: (input.comment as string) || null,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  // Parse top-level structure
  const envelope = requestSchema.safeParse(body);
  if (!envelope.success) return apiError(formatZodError(envelope.error), 400);

  const modelId = envelope.data.model;
  const modelConfig = MODELS_MAP.get(modelId);
  if (!modelConfig) return apiError(`Unknown model: ${modelId}`, 400);

  const handler = getHandler(modelId);
  if (!handler) return apiError(`No handler for model: ${modelId}`, 400);

  const inputSchema = getInputSchema(modelId);
  if (!inputSchema) return apiError(`No schema for model: ${modelId}`, 400);

  // Batch mode
  if ('items' in envelope.data) {
    const rawItems = envelope.data.items;

    const parsedItems: Record<string, unknown>[] = [];
    for (let i = 0; i < rawItems.length; i++) {
      const result = inputSchema.safeParse(rawItems[i]);
      if (!result.success)
        return apiError(formatZodError(result.error, `items[${i}].`), 400);
      parsedItems.push(result.data);
    }

    const totalCredits = parsedItems.reduce(
      (sum, it) => sum + handler.resolveCost(modelConfig, it),
      0
    );
    const hasCredits = await checkCreditsAvailable({
      userId: user.userId,
      requiredCredits: totalCredits,
    });
    if (!hasCredits) return apiError('Insufficient credits', 402);

    const results = await Promise.all(
      parsedItems.map((item, i) =>
        executeSubmit(handler, modelId, item, i, user.userId)
      )
    );

    return apiSuccess({ tasks: results });
  }

  // Single mode
  const parsed = inputSchema.safeParse(envelope.data.input);
  if (!parsed.success) return apiError(formatZodError(parsed.error), 400);

  const input = parsed.data as Record<string, unknown>;
  const creditCost = handler.resolveCost(modelConfig, input);
  const hasCredits = await checkCreditsAvailable({
    userId: user.userId,
    requiredCredits: creditCost,
  });
  if (!hasCredits) return apiError('Insufficient credits', 402);

  const result = await executeSubmit(handler, modelId, input, 0, user.userId);

  if ('error' in result) return apiError(result.error, 500);
  return apiSuccess({ task_id: result.task_id });
}
