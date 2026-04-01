import { MODELS_MAP, resolveCreditCost } from '@/config/models';
import { checkCreditsAvailable, lockCredits } from '@/credits/credits';
import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { getDoc } from '@/lib/api-capabilities';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import type { KieVeoInput } from '@/worker/providers/kie-veo';
import { getAdapter } from '@/worker/registry';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';

const MODEL_CONFIG = MODELS_MAP.get('veo-3-1')!;

const DOC = getDoc('/api/agent/models/veo-3-1');
const VALID_ASPECT_RATIOS = ['16:9', '9:16', 'auto'];
const VALID_MODELS = ['fast', 'standard'];
const MODEL_MAP: Record<string, KieVeoInput['model']> = {
  fast: 'veo3_fast',
  standard: 'veo3',
};

interface ItemInput {
  prompt: string;
  /** Keyframes mode: first frame URL */
  first_frame_url?: string;
  /** Keyframes mode: last frame URL (optional, requires first_frame_url) */
  last_frame_url?: string;
  /** Reference mode: 1-3 reference image URLs (fast only) */
  reference_urls?: string[];
  aspect_ratio?: string;
  model?: string;
  seed?: number;
  comment?: string;
  project_id?: string;
}

async function submitOne(
  item: ItemInput,
  index: number,
  userId: string
): Promise<
  { task_id: string; index: number } | { error: string; index: number }
> {
  const aspectRatio = item.aspect_ratio || '16:9';
  // Reference mode forces fast
  const effectiveModel = item.reference_urls?.length
    ? 'fast'
    : item.model || 'fast';
  const upstreamModel = MODEL_MAP[effectiveModel];
  const creditCost = resolveCreditCost(MODEL_CONFIG, {
    model: effectiveModel,
  });

  try {
    const genId = nanoid();

    const adapter = getAdapter('kie-veo');
    const veoInput: KieVeoInput = {
      prompt: item.prompt,
      model: upstreamModel,
      aspect_ratio: aspectRatio as KieVeoInput['aspect_ratio'],
      enableTranslation: false,
    };
    if (item.first_frame_url) veoInput.first_frame_url = item.first_frame_url;
    if (item.last_frame_url) veoInput.last_frame_url = item.last_frame_url;
    if (item.reference_urls?.length)
      veoInput.reference_urls = item.reference_urls;
    if (item.seed !== undefined) veoInput.seeds = item.seed;

    const { taskId } = await adapter.submit(veoInput);

    // Insert generation record first (FK target for credit_transaction)
    const db = await getDb();
    await db.insert(generation).values({
      id: genId,
      userId,
      type: 'video',
      generatorId: 'veo-3-1',
      innerProvider: 'kie-veo',
      innerModelId: `kie-veo31-${effectiveModel}-${item.first_frame_url ? 'i2v' : item.reference_urls?.length ? 'ref' : 't2v'}`,
      innerProviderTaskId: taskId,
      status: 'pending',
      input: {
        prompt: item.prompt,
        model: effectiveModel,
        aspect_ratio: aspectRatio,
        ...(item.first_frame_url
          ? { first_frame_url: item.first_frame_url }
          : {}),
        ...(item.last_frame_url ? { last_frame_url: item.last_frame_url } : {}),
        ...(item.reference_urls?.length
          ? { reference_urls: item.reference_urls }
          : {}),
        ...(item.seed !== undefined ? { seed: item.seed } : {}),
      },
      projectId: item.project_id || null,
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
      description: `veo-3-1 ${effectiveModel}: ${creditCost} credits`,
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
  if (
    item.aspect_ratio &&
    !VALID_ASPECT_RATIOS.includes(item.aspect_ratio.toLowerCase())
  ) {
    return `${prefix}aspect_ratio invalid: got '${item.aspect_ratio}', expected one of ${JSON.stringify(VALID_ASPECT_RATIOS)}`;
  }
  if (item.model && !VALID_MODELS.includes(item.model)) {
    return `${prefix}model invalid: got '${item.model}', expected one of ${JSON.stringify(VALID_MODELS)}`;
  }
  if (
    item.comment !== undefined &&
    typeof item.comment === 'string' &&
    item.comment.length > 500
  ) {
    return `${prefix}comment must be at most 500 characters`;
  }
  // Mutual exclusivity: cannot mix keyframes and reference
  if (item.first_frame_url && item.reference_urls?.length) {
    return `${prefix}cannot use both first_frame_url and reference_urls — choose keyframes or reference mode`;
  }
  if (item.last_frame_url && !item.first_frame_url) {
    return `${prefix}last_frame_url requires first_frame_url`;
  }
  if (item.reference_urls !== undefined) {
    if (
      !Array.isArray(item.reference_urls) ||
      item.reference_urls.length === 0
    ) {
      return `${prefix}reference_urls must be a non-empty array of URLs`;
    }
    if (item.reference_urls.length > 3) {
      return `${prefix}reference_urls supports at most 3 images`;
    }
  }
  if (item.seed !== undefined) {
    if (
      typeof item.seed !== 'number' ||
      item.seed < 10000 ||
      item.seed > 99999
    ) {
      return `${prefix}seed must be a number between 10000 and 99999`;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized(DOC);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400, DOC);
  }

  // Batch mode
  if (Array.isArray(body.items)) {
    const items = body.items as ItemInput[];
    if (items.length === 0) {
      return apiError("'items' array must not be empty", 400, DOC);
    }
    if (items.length > 20) {
      return apiError("'items' array must have at most 20 entries", 400, DOC);
    }

    for (let i = 0; i < items.length; i++) {
      const err = validateItem(items[i], `items[${i}].`);
      if (err) return apiError(err, 400, DOC);
    }

    // Check credits for entire batch (sum per-item costs)
    const totalCredits = items.reduce((sum, it) => {
      const model = it.reference_urls?.length ? 'fast' : it.model || 'fast';
      return sum + resolveCreditCost(MODEL_CONFIG, { model });
    }, 0);
    const hasCredits = await checkCreditsAvailable({
      userId: user.userId,
      requiredCredits: totalCredits,
    });
    if (!hasCredits) {
      return apiError('Insufficient credits', 402, DOC);
    }

    const results = await Promise.all(
      items.map((item, i) => submitOne(item, i, user.userId))
    );

    return apiSuccess({ tasks: results }, DOC);
  }

  // Single mode
  const item: ItemInput = {
    prompt: body.prompt as string,
    first_frame_url: body.first_frame_url as string | undefined,
    last_frame_url: body.last_frame_url as string | undefined,
    reference_urls: body.reference_urls as string[] | undefined,
    aspect_ratio: body.aspect_ratio as string | undefined,
    model: body.model as string | undefined,
    seed: body.seed as number | undefined,
    comment: body.comment as string | undefined,
    project_id: body.project_id as string | undefined,
  };

  const err = validateItem(item, '');
  if (err) return apiError(err, 400, DOC);

  // Check credits for single request
  const effectiveModel = item.reference_urls?.length
    ? 'fast'
    : item.model || 'fast';
  const creditCost = resolveCreditCost(MODEL_CONFIG, {
    model: effectiveModel,
  });
  const hasCredits = await checkCreditsAvailable({
    userId: user.userId,
    requiredCredits: creditCost,
  });
  if (!hasCredits) {
    return apiError('Insufficient credits', 402, DOC);
  }

  const result = await submitOne(item, 0, user.userId);

  if ('error' in result) {
    return apiError(result.error, 500, DOC);
  }

  return apiSuccess({ task_id: result.task_id }, DOC);
}
