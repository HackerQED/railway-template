import { FOLDERS, STORAGE_PUBLIC_URL } from '@/config/storage';
import { isMocked } from '@/lib/mock';
import { nanoid } from 'nanoid';
import type { PollResult, ProviderAdapter, SubmitInput } from '../types';
import { withRetry } from '../utils/retry';

const mockTasks = new Map<string, number>();

export type WaveSpeedInput = Record<string, unknown> & {
  /** WaveSpeed model path (e.g. 'wavespeed-ai/cinematic-video-generator') */
  _model?: string;
};

const WAVESPEED_BASE_URL = 'https://api.wavespeed.ai/api/v3';
const WAVESPEED_DEFAULT_MODEL = 'wavespeed-ai/cinematic-video-generator';

function getApiKey(): string {
  const key = process.env.WAVESPEED_API_KEY;
  if (!key)
    throw new Error('WAVESPEED_API_KEY environment variable is not set');
  return key;
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
}

interface WaveSpeedResponse {
  code: number;
  message: string;
  data: {
    id: string;
    model: string;
    outputs: string[];
    status: 'created' | 'processing' | 'completed' | 'failed';
    created_at: string;
    error: string;
    has_nsfw_contents: boolean[] | null;
    timings: { inference: number };
  };
}

export const wavespeedAdapter: ProviderAdapter = {
  name: 'wavespeed',

  async submit(raw: SubmitInput): Promise<{ taskId: string }> {
    if (isMocked()) {
      const taskId = `mock-wavespeed-${nanoid()}`;
      mockTasks.set(taskId, 0);
      return { taskId };
    }

    const input = raw as unknown as WaveSpeedInput;
    const { _model, ...payload } = input;
    const model = _model ?? WAVESPEED_DEFAULT_MODEL;

    const res = await withRetry(() =>
      fetch(`${WAVESPEED_BASE_URL}/${model}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`WaveSpeed submit failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as WaveSpeedResponse;

    if (json.code !== 200) {
      throw new Error(`WaveSpeed submit error: ${json.message}`);
    }

    return { taskId: json.data.id };
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

    const res = await withRetry(() =>
      fetch(`${WAVESPEED_BASE_URL}/predictions/${taskId}/result`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
        },
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`WaveSpeed poll failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as WaveSpeedResponse;

    switch (json.data.status) {
      case 'completed':
        return {
          status: 'done',
          output: { urls: json.data.outputs },
        };
      case 'failed':
        return {
          status: 'failed',
          error: {
            code: 'WAVESPEED_FAILED',
            message: json.data.error || 'Generation failed',
          },
        };
      case 'processing':
        return { status: 'processing' };
      default:
        return { status: 'pending' };
    }
  },
};
