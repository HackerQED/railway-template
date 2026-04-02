import { MODELS_MAP, resolveCreditCost } from '@/config/models';
import { checkCreditsAvailable, lockCredits } from '@/credits/credits';
import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import type { KieInput } from '@/worker/providers/kie';
import { getAdapter } from '@/worker/registry';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';

const MODEL_CONFIG = MODELS_MAP.get('seedream-4-5')!;

const VALID_ASPECT_RATIOS = [
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '2:3',
  '3:2',
  '21:9',
];
const VALID_QUALITIES = ['basic', 'high'];

interface ItemInput {
  prompt: string;
  image_urls?: string[];
  aspect_ratio?: string;
  quality?: string;
  comment?: string;
}

function resolveModel(item: ItemInput): string {
  return item.image_urls?.length
    ? 'seedream/4.5-edit'
    : 'seedream/4.5-text-to-image';
}

async function submitOne(
  item: ItemInput,
  index: number,
  userId: string
): Promise<
  { task_id: string; index: number } | { error: string; index: number }
> {
  const aspectRatio = item.aspect_ratio || '16:9';
  const quality = item.quality || 'basic';
  const model = resolveModel(item);
  const creditCost = resolveCreditCost(MODEL_CONFIG, {});

  try {
    const genId = nanoid();

    const adapter = getAdapter('kie');
    const kieInput: KieInput = {
      model,
      input: {
        prompt: item.prompt,
        aspect_ratio: aspectRatio,
        quality,
      },
    };
    if (item.image_urls?.length) {
      kieInput.input.image_urls = item.image_urls;
    }

    const { taskId } = await adapter.submit(kieInput);

    // Insert generation record first (FK target for credit_transaction)
    const db = await getDb();
    await db.insert(generation).values({
      id: genId,
      userId,
      type: 'image',
      generatorId: 'seedream-4-5',
      innerProvider: 'kie',
      innerModelId: item.image_urls?.length
        ? 'kie-seedream-4.5-edit'
        : 'kie-seedream-4.5-t2i',
      innerProviderTaskId: taskId,
      status: 'pending',
      input: {
        prompt: item.prompt,
        aspect_ratio: aspectRatio,
        quality,
        ...(item.image_urls?.length ? { image_urls: item.image_urls } : {}),
      },
      comment: item.comment || null,
      sortOrder: index,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Lock credits after generation record exists
    await lockCredits({
      userId,
      amount: creditCost,
      generationId: genId,
      description: `seedream-4-5: ${creditCost} credits`,
    });

    return { task_id: genId, index };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: sanitizeErrorMessage(msg), index };
  }
}

function validateItem(item: ItemInput, prefix: string): string | null {
  if (!item.prompt || typeof item.prompt !== 'string') {
    return `${prefix}prompt is required (string)`;
  }
  if (item.aspect_ratio && !VALID_ASPECT_RATIOS.includes(item.aspect_ratio)) {
    return `${prefix}aspect_ratio invalid: got '${item.aspect_ratio}', expected one of ${JSON.stringify(VALID_ASPECT_RATIOS)}`;
  }
  if (item.quality && !VALID_QUALITIES.includes(item.quality)) {
    return `${prefix}quality invalid: got '${item.quality}', expected one of ${JSON.stringify(VALID_QUALITIES)}`;
  }
  if (
    item.comment !== undefined &&
    typeof item.comment === 'string' &&
    item.comment.length > 500
  ) {
    return `${prefix}comment must be at most 100 characters`;
  }
  if (item.image_urls !== undefined) {
    if (!Array.isArray(item.image_urls) || item.image_urls.length === 0) {
      return `${prefix}image_urls must be a non-empty array of URLs`;
    }
    if (item.image_urls.length > 14) {
      return `${prefix}image_urls supports at most 14 images`;
    }
  }
  return null;
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

  // Batch mode
  if (Array.isArray(body.items)) {
    const items = body.items as ItemInput[];
    if (items.length === 0) {
      return apiError("'items' array must not be empty", 400);
    }
    if (items.length > 20) {
      return apiError("'items' array must have at most 20 entries", 400);
    }

    for (let i = 0; i < items.length; i++) {
      const err = validateItem(items[i], `items[${i}].`);
      if (err) return apiError(err, 400);
    }

    // Check credits for entire batch upfront
    const totalCredits = resolveCreditCost(MODEL_CONFIG, {}) * items.length;
    const hasCredits = await checkCreditsAvailable({
      userId: user.userId,
      requiredCredits: totalCredits,
    });
    if (!hasCredits) {
      return apiError('Insufficient credits', 402);
    }

    const results = await Promise.all(
      items.map((item, i) => submitOne(item, i, user.userId))
    );

    return apiSuccess({ tasks: results });
  }

  // Single mode
  const item: ItemInput = {
    prompt: body.prompt as string,
    aspect_ratio: body.aspect_ratio as string | undefined,
    quality: body.quality as string | undefined,
    image_urls: body.image_urls as string[] | undefined,
    comment: body.comment as string | undefined,
  };

  const err = validateItem(item, '');
  if (err) return apiError(err, 400);

  // Check credits for single request
  const creditCost = resolveCreditCost(MODEL_CONFIG, {});
  const hasCredits = await checkCreditsAvailable({
    userId: user.userId,
    requiredCredits: creditCost,
  });
  if (!hasCredits) {
    return apiError('Insufficient credits', 402);
  }

  const result = await submitOne(item, 0, user.userId);

  if ('error' in result) {
    return apiError(result.error, 500);
  }

  return apiSuccess({ task_id: result.task_id });
}
