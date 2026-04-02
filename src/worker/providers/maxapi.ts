import { FOLDERS, STORAGE_PUBLIC_URL } from '@/config/storage';
import { isMocked } from '@/lib/mock';
import { nanoid } from 'nanoid';
import type { PollResult, ProviderAdapter, SubmitInput } from '../types';
import { withRetry } from '../utils/retry';

const mockTasks = new Map<string, number>();

export type MaxApiInput = {
  prompt: string;
  /** Image/video URLs for image-to-video mode. Use @1, @2 in prompt to reference by position. */
  mediaUrls?: string[];
  ratio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  resolution?: '480p' | '720p' | '1080p';
  /** Duration in seconds: 4-15 for seedance-2.0, 5 or 10 for 1.5-pro */
  duration?: number;
  /** Use seedance-2.0-fast instead of seedance-2.0 */
  fast?: boolean;
  /** Auto-fallback to seedance-1.5-pro on failure (default: false) */
  fallback?: boolean;
};

const MAXAPI_BASE_URL = 'https://api.maxapi.io/api/v1';

function getApiKey(): string {
  const key = process.env.MAXAPI_API_KEY;
  if (!key) throw new Error('MAXAPI_API_KEY environment variable is not set');
  return key;
}

function getWebhookUrl(): string {
  const base = process.env.WEBHOOK_BASE_URL;
  if (!base)
    throw new Error('WEBHOOK_BASE_URL environment variable is not set');
  return `${base}/api/webhooks/maxapi`;
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
}

export const maxapiAdapter: ProviderAdapter = {
  name: 'maxapi',

  async submit(raw: SubmitInput): Promise<{ taskId: string }> {
    if (isMocked()) {
      const taskId = `mock-maxapi-${nanoid()}`;
      mockTasks.set(taskId, 0);
      return { taskId };
    }

    const input = raw as unknown as MaxApiInput;

    const model = input.fast ? 'seedance-2.0-fast' : 'seedance-2.0';

    const inputPayload: Record<string, unknown> = {
      prompt: input.prompt,
    };
    if (input.mediaUrls?.length) inputPayload.mediaUrls = input.mediaUrls;
    if (input.ratio) inputPayload.ratio = input.ratio;
    if (input.resolution) inputPayload.resolution = input.resolution;
    if (input.duration !== undefined) inputPayload.duration = input.duration;
    if (input.fallback !== undefined) inputPayload.fallback = input.fallback;

    const body: Record<string, unknown> = {
      model,
      input: inputPayload,
      callBackUrl: getWebhookUrl(),
    };

    const res = await withRetry(() =>
      fetch(`${MAXAPI_BASE_URL}/task/submit`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MaxAPI submit failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      code: number;
      msg: string;
      data: { taskId: string };
    };

    if (json.code !== 0) {
      throw new Error(`MaxAPI submit error: ${json.msg}`);
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
            `${STORAGE_PUBLIC_URL}/${FOLDERS.GENERATION}/36586848-d873-48ca-a811-c4eb2926ed83.mp4`,
          ],
        },
      };
    }

    // Webhook-driven provider — poll is not used in production.
    // Return pending so the worker doesn't mark it as stuck.
    return { status: 'pending' };
  },
};
