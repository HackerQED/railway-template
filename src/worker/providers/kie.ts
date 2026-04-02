import { FOLDERS, STORAGE_PUBLIC_URL } from '@/config/storage';
import { isMocked } from '@/lib/mock';
import { nanoid } from 'nanoid';
import type { PollResult, ProviderAdapter, SubmitInput } from '../types';
import { withRetry } from '../utils/retry';

const mockTasks = new Map<string, number>();

export type KieInput = {
  model: string;
  input: {
    prompt: string;
    aspect_ratio?: string;
    quality?: string;
    image_urls?: string[];
  };
};

const KIE_BASE_URL = 'https://api.kie.ai/api/v1';

function getApiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error('KIE_API_KEY environment variable is not set');
  return key;
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
}

export const kieAdapter: ProviderAdapter = {
  name: 'kie',

  async submit(raw: SubmitInput): Promise<{ taskId: string }> {
    if (isMocked()) {
      const taskId = `mock-kie-${nanoid()}`;
      mockTasks.set(taskId, 0);
      return { taskId };
    }

    const input = raw as unknown as KieInput;
    const body = {
      model: input.model,
      input: input.input,
    };

    const res = await withRetry(() =>
      fetch(`${KIE_BASE_URL}/jobs/createTask`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`KIE createTask failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      code: number;
      msg: string;
      data: { taskId: string };
    };

    if (json.code !== 200) {
      throw new Error(`KIE createTask error: ${json.msg}`);
    }

    return { taskId: json.data.taskId };
  },

  async poll(taskId: string): Promise<PollResult> {
    if (isMocked()) {
      const count = mockTasks.get(taskId) ?? 0;
      mockTasks.set(taskId, count + 1);
      if (count < 2) {
        return { status: count === 0 ? 'pending' : 'processing' };
      }
      mockTasks.delete(taskId);
      return {
        status: 'done',
        output: {
          urls: [
            `${STORAGE_PUBLIC_URL}/${FOLDERS.GENERATION}/64f77beb-d1db-442b-98ae-49b2940bb115.jpg`,
          ],
        },
      };
    }

    const res = await withRetry(() =>
      fetch(`${KIE_BASE_URL}/jobs/recordInfo?taskId=${taskId}`, {
        headers: headers(),
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`KIE recordInfo failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      code: number;
      msg: string;
      data: {
        state: 'waiting' | 'success' | 'fail';
        resultJson: string | null;
        failCode: string | null;
        failMsg: string | null;
      };
    };

    if (json.code !== 200) {
      throw new Error(`KIE recordInfo error: ${json.msg}`);
    }

    const { state, resultJson, failCode, failMsg } = json.data;

    if (state === 'waiting') {
      return { status: 'pending' };
    }

    if (state === 'success' && resultJson) {
      const parsed = JSON.parse(resultJson) as { resultUrls: string[] };
      return { status: 'done', output: { urls: parsed.resultUrls } };
    }

    if (state === 'fail') {
      return {
        status: 'failed',
        error: {
          code: failCode || 'UNKNOWN',
          message: failMsg || 'KIE generation failed',
        },
      };
    }

    return { status: 'pending' };
  },
};
