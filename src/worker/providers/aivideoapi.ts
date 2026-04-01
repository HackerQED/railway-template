import { ASSETS_BASE_URL } from '@/lib/assets';
import { isMocked } from '@/lib/mock';
import { nanoid } from 'nanoid';
import type { PollResult, ProviderAdapter, SubmitInput } from '../types';
import { withRetry } from '../utils/retry';

const mockTasks = new Map<string, number>();

export type AiVideoApiInput = {
  prompt: string;
  /** Image URLs — objects with url and optional real_person flag */
  image_urls?: { url: string; real_person?: boolean }[];
  /** Video URLs for video reference (max 3, total ≤15s) */
  video_urls?: string[];
  /** Audio URLs for audio reference (max 3, total ≤15s) */
  audio_urls?: string[];
  /** Duration in seconds: 4-15 (default 5) */
  duration?: number;
  /** Aspect ratio (default: adaptive) */
  aspect_ratio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | 'adaptive';
  /** Resolution: 480p or 720p (default 720p) */
  resolution?: '480p' | '720p';
  /** Generate synchronized audio (default true) */
  generate_audio?: boolean;
  /** Add watermark (default false) */
  watermark?: boolean;
};

const AIVIDEOAPI_BASE_URL = 'https://api.aivideoapi.ai/v1';

function getApiKey(): string {
  const key = process.env.AIVIDEOAPI_API_KEY;
  if (!key)
    throw new Error('AIVIDEOAPI_API_KEY environment variable is not set');
  return key;
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
}

export const aivideoapiAdapter: ProviderAdapter = {
  name: 'aivideoapi',

  async submit(raw: SubmitInput): Promise<{ taskId: string }> {
    if (isMocked()) {
      const taskId = `mock-aivideoapi-${nanoid()}`;
      mockTasks.set(taskId, 0);
      return { taskId };
    }

    const input = raw as unknown as AiVideoApiInput;

    const inputPayload: Record<string, unknown> = {
      prompt: input.prompt,
    };
    if (input.image_urls?.length) inputPayload.image_urls = input.image_urls;
    if (input.video_urls?.length) inputPayload.video_urls = input.video_urls;
    if (input.audio_urls?.length) inputPayload.audio_urls = input.audio_urls;
    if (input.duration !== undefined) inputPayload.duration = input.duration;
    if (input.aspect_ratio) inputPayload.aspect_ratio = input.aspect_ratio;
    if (input.resolution) inputPayload.resolution = input.resolution;
    if (input.generate_audio !== undefined)
      inputPayload.generate_audio = input.generate_audio;
    if (input.watermark !== undefined) inputPayload.watermark = input.watermark;

    const body = {
      model: 'doubao-seedance-2.0',
      input: inputPayload,
    };

    const res = await withRetry(() =>
      fetch(`${AIVIDEOAPI_BASE_URL}/videos/generations`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`AiVideoAPI submit failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      code: number;
      msg: string;
      data: { taskId: string };
    };

    if (json.code !== 200) {
      throw new Error(`AiVideoAPI submit error: ${json.msg}`);
    }

    return { taskId: json.data.taskId };
  },

  async poll(taskId: string): Promise<PollResult> {
    if (isMocked()) {
      const count = mockTasks.get(taskId) ?? 0;
      mockTasks.set(taskId, count + 1);
      if (count < 6) {
        return { status: count < 3 ? 'pending' : 'processing' };
      }
      mockTasks.delete(taskId);
      return {
        status: 'done',
        output: {
          urls: [
            `${ASSETS_BASE_URL}/generation/36586848-d873-48ca-a811-c4eb2926ed83.mp4`,
          ],
        },
      };
    }

    const res = await withRetry(() =>
      fetch(`${AIVIDEOAPI_BASE_URL}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
        },
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`AiVideoAPI poll failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      id: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      output?: { urls: string[] };
      error?: { code: string; message: string };
    };

    switch (json.status) {
      case 'completed':
        return {
          status: 'done',
          output: { urls: json.output?.urls ?? [] },
        };
      case 'failed':
        return {
          status: 'failed',
          error: {
            code: json.error?.code ?? 'AIVIDEOAPI_FAILED',
            message: json.error?.message ?? 'Generation failed',
          },
        };
      case 'processing':
        return { status: 'processing' };
      default:
        return { status: 'pending' };
    }
  },
};
