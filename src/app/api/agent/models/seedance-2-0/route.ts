import { MODELS_MAP, resolveCreditCost } from '@/config/models';
import { checkCreditsAvailable, lockCredits } from '@/credits/credits';
import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { getDoc } from '@/lib/api-capabilities';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import type { MaxApiInput } from '@/worker/providers/maxapi';
import { getAdapter } from '@/worker/registry';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';

const MODEL_CONFIG = MODELS_MAP.get('seedance-2-0')!;

const OMNI_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.m4v', // video
  '.mp3',
  '.wav', // audio
];

/** Check if any media URLs contain video or audio (triggers omni-reference pricing) */
function hasOmniMedia(urls?: string[]): boolean {
  if (!urls?.length) return false;
  return urls.some((url) => {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      return OMNI_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    } catch {
      return false;
    }
  });
}

const DOC = getDoc('/api/agent/models/seedance-2-0');
const VALID_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'];
const VALID_RESOLUTIONS = ['480p', '720p', '1080p'];

interface ItemInput {
  prompt: string;
  /** Image URLs for image-to-video mode */
  media_urls?: string[];
  ratio?: string;
  resolution?: string;
  /** Duration in seconds (4-15) */
  duration?: number;
  /** Use fast model variant */
  fast?: boolean;
  comment?: string;
  project_id?: string;
}

/** Coerce string values from frontend toggles/inputs to proper types */
function normalizeItem(item: ItemInput): ItemInput {
  return {
    ...item,
    duration:
      item.duration !== undefined && item.duration !== null
        ? Number(item.duration)
        : undefined,
    fast: item.fast === true || (item.fast as unknown) === 'true',
  };
}

function validateItem(item: ItemInput, prefix: string): string | null {
  if (!item.prompt || typeof item.prompt !== 'string') {
    return `${prefix}prompt is required (string)`;
  }
  if (item.ratio && !VALID_RATIOS.includes(item.ratio)) {
    return `${prefix}ratio invalid: got '${item.ratio}', expected one of ${JSON.stringify(VALID_RATIOS)}`;
  }
  if (item.resolution && !VALID_RESOLUTIONS.includes(item.resolution)) {
    return `${prefix}resolution invalid: got '${item.resolution}', expected one of ${JSON.stringify(VALID_RESOLUTIONS)}`;
  }
  if (item.duration !== undefined) {
    if (
      typeof item.duration !== 'number' ||
      item.duration < 4 ||
      item.duration > 15
    ) {
      return `${prefix}duration must be a number between 4 and 15`;
    }
  }
  if (item.media_urls !== undefined) {
    if (!Array.isArray(item.media_urls) || item.media_urls.length === 0) {
      return `${prefix}media_urls must be a non-empty array of URLs`;
    }
    if (item.media_urls.length > 12) {
      return `${prefix}media_urls supports at most 12 items`;
    }
  }
  if (
    item.comment !== undefined &&
    typeof item.comment === 'string' &&
    item.comment.length > 500
  ) {
    return `${prefix}comment must be at most 500 characters`;
  }
  return null;
}

async function submitOne(
  item: ItemInput,
  index: number,
  userId: string
): Promise<
  { task_id: string; index: number } | { error: string; index: number }
> {
  const mode = item.media_urls?.length ? 'i2v' : 't2v';
  const speed = item.fast ? 'fast' : 'standard';
  const isOmni = hasOmniMedia(item.media_urls);
  const creditCost = resolveCreditCost(
    MODEL_CONFIG,
    { fast: String(item.fast ?? false) },
    isOmni
  );

  try {
    const genId = nanoid();

    const adapter = getAdapter('maxapi');
    const maxInput: MaxApiInput = {
      prompt: item.prompt,
      fast: item.fast ?? false,
      fallback: false,
    };
    if (item.media_urls?.length) maxInput.mediaUrls = item.media_urls;
    if (item.ratio) maxInput.ratio = item.ratio as MaxApiInput['ratio'];
    if (item.resolution)
      maxInput.resolution = item.resolution as MaxApiInput['resolution'];
    if (item.duration !== undefined) maxInput.duration = item.duration;

    const { taskId } = await adapter.submit(maxInput);

    // Insert generation record first (FK target for credit_transaction)
    const db = await getDb();
    await db.insert(generation).values({
      id: genId,
      userId,
      type: 'video',
      generatorId: 'seedance-2-0',
      innerProvider: 'maxapi',
      innerModelId: `maxapi-seedance-2.0-${speed}-${mode}${isOmni ? '-omni' : ''}`,
      innerProviderTaskId: taskId,
      status: 'pending',
      input: {
        prompt: item.prompt,
        ...(item.media_urls?.length ? { media_urls: item.media_urls } : {}),
        ...(item.ratio ? { ratio: item.ratio } : {}),
        ...(item.resolution ? { resolution: item.resolution } : {}),
        ...(item.duration !== undefined ? { duration: item.duration } : {}),
        ...(item.fast ? { fast: true } : {}),
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
      description: `seedance-2-0 ${speed}${isOmni ? '+omni' : ''}: ${creditCost} credits`,
    });

    return { task_id: genId, index };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: sanitizeErrorMessage(msg), index };
  }
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
      items[i] = normalizeItem(items[i]);
      const err = validateItem(items[i], `items[${i}].`);
      if (err) return apiError(err, 400, DOC);
    }

    // Check credits for entire batch (sum per-item costs)
    const totalCredits = items.reduce((sum, it) => {
      const isOmni = hasOmniMedia(it.media_urls);
      return (
        sum +
        resolveCreditCost(
          MODEL_CONFIG,
          { fast: String(it.fast ?? false) },
          isOmni
        )
      );
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
  const item = normalizeItem({
    prompt: body.prompt as string,
    media_urls: body.media_urls as string[] | undefined,
    ratio: body.ratio as string | undefined,
    resolution: body.resolution as string | undefined,
    duration: body.duration as number | undefined,
    fast: body.fast as boolean | undefined,
    comment: body.comment as string | undefined,
    project_id: body.project_id as string | undefined,
  });

  const err = validateItem(item, '');
  if (err) return apiError(err, 400, DOC);

  // Check credits for single request
  const isOmni = hasOmniMedia(item.media_urls);
  const creditCost = resolveCreditCost(
    MODEL_CONFIG,
    { fast: String(item.fast ?? false) },
    isOmni
  );
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
