import { MODELS_MAP, resolveCreditCost } from '@/config/models';
import { checkCreditsAvailable, lockCredits } from '@/credits/credits';
import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import type { AiVideoApiInput } from '@/worker/providers/aivideoapi';
import { getAdapter } from '@/worker/registry';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';

const MODEL_CONFIG = MODELS_MAP.get('seedance-2-0-human')!;

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

const VALID_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', 'adaptive'];
const VALID_RESOLUTIONS = ['480p', '720p'];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav'];

interface ItemInput {
  prompt: string;
  /** Media URLs for image-to-video mode (images, videos, audio) */
  media_urls?: string[];
  aspect_ratio?: string;
  resolution?: string;
  /** Duration in seconds (4-15) */
  duration?: number;
  /** Per-URL real-person flags: { "url": true } */
  real_person_flags?: Record<string, boolean>;
  comment?: string;
}

function normalizeItem(item: ItemInput): ItemInput {
  return {
    ...item,
    duration:
      item.duration !== undefined && item.duration !== null
        ? Number(item.duration)
        : undefined,
  };
}

function validateItem(item: ItemInput, prefix: string): string | null {
  if (!item.prompt || typeof item.prompt !== 'string') {
    return `${prefix}prompt is required (string)`;
  }
  if (item.aspect_ratio && !VALID_RATIOS.includes(item.aspect_ratio)) {
    return `${prefix}aspect_ratio invalid: got '${item.aspect_ratio}', expected one of ${JSON.stringify(VALID_RATIOS)}`;
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

/** Classify media URLs into image/video/audio buckets */
function classifyMedia(
  urls: string[],
  realPersonFlags?: Record<string, boolean>
): {
  imageUrls: { url: string; real_person?: boolean }[];
  videoUrls: string[];
  audioUrls: string[];
} {
  const imageUrls: { url: string; real_person?: boolean }[] = [];
  const videoUrls: string[] = [];
  const audioUrls: string[] = [];

  for (const url of urls) {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      if (VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
        videoUrls.push(url);
      } else if (AUDIO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
        audioUrls.push(url);
      } else {
        const isRealPerson = realPersonFlags?.[url] ?? false;
        imageUrls.push(isRealPerson ? { url, real_person: true } : { url });
      }
    } catch {
      const isRealPerson = realPersonFlags?.[url] ?? false;
      imageUrls.push(isRealPerson ? { url, real_person: true } : { url });
    }
  }

  return { imageUrls, videoUrls, audioUrls };
}

async function submitOne(
  item: ItemInput,
  index: number,
  userId: string
): Promise<
  { task_id: string; index: number } | { error: string; index: number }
> {
  const mode = item.media_urls?.length ? 'i2v' : 't2v';
  const isOmni = hasOmniMedia(item.media_urls);
  const creditCost = resolveCreditCost(
    MODEL_CONFIG,
    {
      resolution: item.resolution ?? '480p',
      duration: String(item.duration ?? 4),
    },
    isOmni
  );

  try {
    const genId = nanoid();

    const adapter = getAdapter('aivideoapi');
    const apiInput: AiVideoApiInput = {
      prompt: item.prompt,
      resolution: (item.resolution as AiVideoApiInput['resolution']) ?? '480p',
    };
    if (item.aspect_ratio)
      apiInput.aspect_ratio =
        item.aspect_ratio as AiVideoApiInput['aspect_ratio'];
    if (item.duration !== undefined) apiInput.duration = item.duration;

    // Classify media into image/video/audio and build API payload
    if (item.media_urls?.length) {
      const { imageUrls, videoUrls, audioUrls } = classifyMedia(
        item.media_urls,
        item.real_person_flags
      );
      if (imageUrls.length) apiInput.image_urls = imageUrls;
      if (videoUrls.length) apiInput.video_urls = videoUrls;
      if (audioUrls.length) apiInput.audio_urls = audioUrls;
    }

    const { taskId } = await adapter.submit(apiInput);

    // Insert generation record first (FK target for credit_transaction)
    const db = await getDb();
    await db.insert(generation).values({
      id: genId,
      userId,
      type: 'video',
      generatorId: 'seedance-2-0-human',
      innerProvider: 'aivideoapi',
      innerModelId: `aivideoapi-seedance-2.0-${item.resolution ?? '480p'}-${mode}${isOmni ? '-omni' : ''}`,
      innerProviderTaskId: taskId,
      status: 'pending',
      input: {
        prompt: item.prompt,
        ...(item.media_urls?.length ? { media_urls: item.media_urls } : {}),
        ...(item.aspect_ratio ? { aspect_ratio: item.aspect_ratio } : {}),
        ...(item.resolution ? { resolution: item.resolution } : {}),
        ...(item.duration !== undefined ? { duration: item.duration } : {}),
        ...(item.real_person_flags &&
        Object.keys(item.real_person_flags).length > 0
          ? { real_person_flags: item.real_person_flags }
          : {}),
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
      description: `seedance-2-0-human ${item.resolution ?? '480p'}${isOmni ? '+omni' : ''}: ${creditCost} credits`,
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
      items[i] = normalizeItem(items[i]);
      const err = validateItem(items[i], `items[${i}].`);
      if (err) return apiError(err, 400);
    }

    // Check credits for entire batch (sum per-item costs)
    const totalCredits = items.reduce((sum, it) => {
      const isOmni = hasOmniMedia(it.media_urls);
      return (
        sum +
        resolveCreditCost(
          MODEL_CONFIG,
          {
            resolution: it.resolution ?? '720p',
            duration: String(it.duration ?? 5),
          },
          isOmni
        )
      );
    }, 0);
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
  const item = normalizeItem({
    prompt: body.prompt as string,
    media_urls: body.media_urls as string[] | undefined,
    aspect_ratio: body.aspect_ratio as string | undefined,
    resolution: body.resolution as string | undefined,
    duration: body.duration as number | undefined,
    real_person_flags: body.real_person_flags as
      | Record<string, boolean>
      | undefined,
    comment: body.comment as string | undefined,
  });

  const err = validateItem(item, '');
  if (err) return apiError(err, 400);

  // Check credits for single request
  const isOmni = hasOmniMedia(item.media_urls);
  const creditCost = resolveCreditCost(
    MODEL_CONFIG,
    {
      resolution: item.resolution ?? '480p',
      duration: String(item.duration ?? 4),
    },
    isOmni
  );
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
