import { FOLDERS, STORAGE_PUBLIC_URL } from '@/config/storage';
import { isMocked } from '@/lib/mock';
import { nanoid } from 'nanoid';
import type { PollResult, ProviderAdapter, SubmitInput } from '../types';
import { withRetry } from '../utils/retry';

const mockTasks = new Map<string, number>();

export type KieVeoInput = {
  prompt: string;
  /** Keyframes mode: first frame (required), generates video starting from this image */
  first_frame_url?: string;
  /** Keyframes mode: last frame (optional), generates transition from first to last */
  last_frame_url?: string;
  /** Reference mode: 1-3 reference images for style-guided generation (fast only) */
  reference_urls?: string[];
  model?: 'veo3' | 'veo3_fast';
  aspect_ratio?: '16:9' | '9:16' | 'Auto';
  seeds?: number;
  enableTranslation?: boolean;
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

export const kieVeoAdapter: ProviderAdapter = {
  name: 'kie-veo',

  async submit(raw: SubmitInput): Promise<{ taskId: string }> {
    if (isMocked()) {
      const taskId = `mock-veo-${nanoid()}`;
      mockTasks.set(taskId, 0);
      return { taskId };
    }

    const input = raw as unknown as KieVeoInput;

    // Determine generation type and imageUrls from explicit input fields
    let generationType: string | undefined;
    let imageUrls: string[] | undefined;

    if (input.reference_urls?.length) {
      generationType = 'REFERENCE_2_VIDEO';
      imageUrls = input.reference_urls;
    } else if (input.first_frame_url) {
      generationType = 'FIRST_AND_LAST_FRAMES_2_VIDEO';
      imageUrls = input.last_frame_url
        ? [input.first_frame_url, input.last_frame_url]
        : [input.first_frame_url];
    }

    const body: Record<string, unknown> = {
      prompt: input.prompt,
      // Reference mode only works with veo3_fast
      model:
        generationType === 'REFERENCE_2_VIDEO'
          ? 'veo3_fast'
          : (input.model ?? 'veo3_fast'),
      aspect_ratio: input.aspect_ratio ?? '16:9',
      enableTranslation: input.enableTranslation ?? false,
    };
    if (imageUrls?.length) body.imageUrls = imageUrls;
    if (generationType) body.generationType = generationType;
    if (input.seeds !== undefined) body.seeds = input.seeds;

    const res = await withRetry(() =>
      fetch(`${KIE_BASE_URL}/veo/generate`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`KIE Veo generate failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      code: number;
      msg: string;
      data: { taskId: string };
    };

    if (json.code !== 200) {
      throw new Error(`KIE Veo generate error: ${json.msg}`);
    }

    return { taskId: json.data.taskId };
  },

  async poll(taskId: string): Promise<PollResult> {
    if (isMocked()) {
      const count = mockTasks.get(taskId) ?? 0;
      mockTasks.set(taskId, count + 1);
      if (count < 4) {
        return { status: count < 2 ? 'pending' : 'processing' };
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
      fetch(`${KIE_BASE_URL}/veo/record-info?taskId=${taskId}`, {
        headers: headers(),
      })
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`KIE Veo record-info failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as {
      code: number;
      msg: string;
      data: {
        successFlag: number;
        response: {
          resultUrls: string[] | null;
        } | null;
        errorCode: number | null;
        errorMessage: string | null;
      };
    };

    if (json.code !== 200) {
      throw new Error(`KIE Veo record-info error (${json.code}): ${json.msg}`);
    }

    const { successFlag, response, errorCode, errorMessage } = json.data;

    if (successFlag === 0) {
      return { status: 'processing' };
    }

    if (successFlag === 1 && response?.resultUrls?.length) {
      return { status: 'done', output: { urls: response.resultUrls } };
    }

    if (successFlag === 2 || successFlag === 3) {
      return {
        status: 'failed',
        error: {
          code: String(errorCode || 'UNKNOWN'),
          message: errorMessage || 'KIE Veo generation failed',
        },
      };
    }

    return { status: 'pending' };
  },
};
