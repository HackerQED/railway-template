import { MODELS_MAP, resolveCreditCost } from '@/config/models';
import { checkCreditsAvailable, lockCredits } from '@/credits/credits';
import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { resolveApiUser } from '@/lib/api-auth';
import { getDoc } from '@/lib/api-capabilities';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import type { WaveSpeedInput } from '@/worker/providers/wavespeed';
import { getAdapter } from '@/worker/registry';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';

const MODEL_CONFIG = MODELS_MAP.get('seedance-1-5')!;

const DOC = getDoc('/api/agent/models/seedance-1-5');
const VALID_RATIOS = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'];
const VALID_RESOLUTIONS = ['480p', '720p', '1080p'];

/** Map mode + fast → WaveSpeed model path */
function resolveUpstreamModel(
  mode: 'i2v' | 't2v' | 'extend',
  fast: boolean
): string {
  const suffix = fast ? '-fast' : '';
  const modeMap = {
    i2v: 'image-to-video',
    t2v: 'text-to-video',
    extend: 'video-extend',
  };
  return `bytedance/seedance-v1.5-pro/${modeMap[mode]}${suffix}`;
}

interface ItemInput {
  prompt: string;
  /** First-frame image URL (triggers i2v mode) */
  image?: string;
  /** Last-frame image URL (i2v only) */
  last_image?: string;
  /** Input video URL (triggers video extend mode) */
  video?: string;
  aspect_ratio?: string;
  /** Duration in seconds (4-12) */
  duration?: number;
  resolution?: string;
  /** Generate audio alongside video */
  generate_audio?: boolean;
  /** Lock camera position */
  camera_fixed?: boolean;
  /** Reproducibility seed (-1 = random) */
  seed?: number;
  /** Use fast model variant */
  fast?: boolean;
  comment?: string;
  project_id?: string;
}

function normalizeItem(item: ItemInput): ItemInput {
  return {
    ...item,
    duration:
      item.duration !== undefined && item.duration !== null
        ? Number(item.duration)
        : undefined,
    seed:
      item.seed !== undefined && item.seed !== null
        ? Number(item.seed)
        : undefined,
    fast: item.fast === true || (item.fast as unknown) === 'true',
    generate_audio:
      item.generate_audio === undefined
        ? undefined
        : item.generate_audio === true ||
          (item.generate_audio as unknown) === 'true',
    camera_fixed:
      item.camera_fixed === undefined
        ? undefined
        : item.camera_fixed === true ||
          (item.camera_fixed as unknown) === 'true',
  };
}

function validateItem(item: ItemInput, prefix: string): string | null {
  if (!item.prompt || typeof item.prompt !== 'string') {
    return `${prefix}prompt is required (string)`;
  }
  if (item.image && item.video) {
    return `${prefix}cannot specify both image and video — use image for i2v, video for extend`;
  }
  if (item.last_image && !item.image) {
    return `${prefix}last_image requires image (only available in image-to-video mode)`;
  }
  if (item.aspect_ratio) {
    if (!VALID_RATIOS.includes(item.aspect_ratio)) {
      return `${prefix}aspect_ratio invalid: got '${item.aspect_ratio}', expected one of ${JSON.stringify(VALID_RATIOS)}`;
    }
    if (item.video) {
      return `${prefix}aspect_ratio is not available in video extend mode`;
    }
  }
  if (item.resolution && !VALID_RESOLUTIONS.includes(item.resolution)) {
    return `${prefix}resolution invalid: got '${item.resolution}', expected one of ${JSON.stringify(VALID_RESOLUTIONS)}`;
  }
  if (item.resolution === '480p' && item.fast !== false) {
    return `${prefix}480p is not available in fast mode`;
  }
  if (item.duration !== undefined) {
    if (
      typeof item.duration !== 'number' ||
      item.duration < 4 ||
      item.duration > 12
    ) {
      return `${prefix}duration must be a number between 4 and 12`;
    }
  }
  if (item.seed !== undefined) {
    if (
      typeof item.seed !== 'number' ||
      item.seed < -1 ||
      item.seed > 2147483647
    ) {
      return `${prefix}seed must be -1 (random) or 0-2147483647`;
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

function detectMode(item: ItemInput): 'i2v' | 't2v' | 'extend' {
  if (item.video) return 'extend';
  if (item.image) return 'i2v';
  return 't2v';
}

async function submitOne(
  item: ItemInput,
  index: number,
  userId: string
): Promise<
  { task_id: string; index: number } | { error: string; index: number }
> {
  const mode = detectMode(item);
  const fast = item.fast ?? true;
  const resolution = item.resolution ?? '480p';
  const duration = item.duration ?? 5;
  const creditCost = resolveCreditCost(MODEL_CONFIG, {
    resolution,
    fast: String(fast),
    duration: String(duration),
  });

  try {
    const genId = nanoid();

    const adapter = getAdapter('wavespeed');
    const wsInput: WaveSpeedInput = {
      _model: resolveUpstreamModel(mode, fast),
      prompt: item.prompt,
    };
    if (item.image) wsInput.image = item.image;
    if (item.last_image) wsInput.last_image = item.last_image;
    if (item.video) wsInput.video = item.video;
    if (item.aspect_ratio) wsInput.aspect_ratio = item.aspect_ratio;
    if (item.duration !== undefined) wsInput.duration = item.duration;
    if (item.resolution) wsInput.resolution = item.resolution;
    if (item.generate_audio !== undefined)
      wsInput.generate_audio = item.generate_audio;
    if (item.camera_fixed !== undefined)
      wsInput.camera_fixed = item.camera_fixed;
    if (item.seed !== undefined) wsInput.seed = item.seed;

    const { taskId } = await adapter.submit(wsInput);

    const db = await getDb();
    await db.insert(generation).values({
      id: genId,
      userId,
      type: 'video',
      generatorId: 'seedance-1-5',
      innerProvider: 'wavespeed',
      innerModelId: `wavespeed-seedance-1.5-pro-${fast ? 'fast' : 'standard'}-${mode}`,
      innerProviderTaskId: taskId,
      status: 'pending',
      input: {
        prompt: item.prompt,
        ...(item.image ? { image: item.image } : {}),
        ...(item.last_image ? { last_image: item.last_image } : {}),
        ...(item.video ? { video: item.video } : {}),
        ...(item.aspect_ratio ? { aspect_ratio: item.aspect_ratio } : {}),
        ...(item.duration !== undefined ? { duration: item.duration } : {}),
        ...(item.resolution ? { resolution: item.resolution } : {}),
        ...(item.generate_audio !== undefined
          ? { generate_audio: item.generate_audio }
          : {}),
        ...(item.camera_fixed !== undefined
          ? { camera_fixed: item.camera_fixed }
          : {}),
        ...(item.seed !== undefined ? { seed: item.seed } : {}),
        ...(item.fast ? { fast: true } : {}),
      },
      projectId: item.project_id || null,
      comment: item.comment || null,
      sortOrder: index,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await lockCredits({
      userId,
      amount: creditCost,
      generationId: genId,
      description: `seedance-1-5 ${fast ? 'fast' : 'standard'} ${mode}: ${creditCost} credits`,
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

    const totalCredits = items.reduce((sum, it) => {
      return (
        sum +
        resolveCreditCost(MODEL_CONFIG, {
          resolution: it.resolution ?? '480p',
          fast: String(it.fast ?? true),
          duration: String(it.duration ?? 5),
        })
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
    image: body.image as string | undefined,
    last_image: body.last_image as string | undefined,
    video: body.video as string | undefined,
    aspect_ratio: body.aspect_ratio as string | undefined,
    duration: body.duration as number | undefined,
    resolution: body.resolution as string | undefined,
    generate_audio: body.generate_audio as boolean | undefined,
    camera_fixed: body.camera_fixed as boolean | undefined,
    seed: body.seed as number | undefined,
    fast: body.fast as boolean | undefined,
    comment: body.comment as string | undefined,
    project_id: body.project_id as string | undefined,
  });

  const err = validateItem(item, '');
  if (err) return apiError(err, 400, DOC);

  const creditCost = resolveCreditCost(MODEL_CONFIG, {
    resolution: item.resolution ?? '480p',
    fast: String(item.fast ?? true),
    duration: String(item.duration ?? 5),
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
