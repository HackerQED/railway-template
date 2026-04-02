import { type ModelConfig, resolveCreditCost } from '@/config/models';
import type { KieVeoInput } from '@/worker/providers/kie-veo';
import type { ModelHandler, SubmitResult } from './types';

const VALID_ASPECT_RATIOS = ['16:9', '9:16', 'auto'];
const VALID_MODELS = ['fast', 'standard'];
const MODEL_MAP: Record<string, KieVeoInput['model']> = { fast: 'veo3_fast', standard: 'veo3' };

export const veo31Handler: ModelHandler = {
  validate(item, prefix) {
    if (!item.prompt || typeof item.prompt !== 'string') return `${prefix}prompt is required (string)`;
    if (item.aspect_ratio && !VALID_ASPECT_RATIOS.includes((item.aspect_ratio as string).toLowerCase())) return `${prefix}aspect_ratio invalid`;
    if (item.model && !VALID_MODELS.includes(item.model as string)) return `${prefix}model invalid`;
    if (item.comment !== undefined && typeof item.comment === 'string' && item.comment.length > 500) return `${prefix}comment too long`;
    if (item.first_frame_url && (item.reference_urls as string[])?.length) {
      return `${prefix}cannot use both first_frame_url and reference_urls`;
    }
    if (item.last_frame_url && !item.first_frame_url) return `${prefix}last_frame_url requires first_frame_url`;
    if (item.reference_urls !== undefined) {
      if (!Array.isArray(item.reference_urls) || item.reference_urls.length === 0) return `${prefix}reference_urls must be a non-empty array`;
      if (item.reference_urls.length > 3) return `${prefix}reference_urls supports at most 3 images`;
    }
    if (item.seed !== undefined) {
      if (typeof item.seed !== 'number' || item.seed < 10000 || item.seed > 99999) return `${prefix}seed must be 10000-99999`;
    }
    return null;
  },

  resolveCost(config, item) {
    const effectiveModel = (item.reference_urls as string[])?.length ? 'fast' : (item.model as string) || 'fast';
    return resolveCreditCost(config, { model: effectiveModel });
  },

  async submit(item): Promise<SubmitResult> {
    const referenceUrls = item.reference_urls as string[] | undefined;
    const effectiveModel = referenceUrls?.length ? 'fast' : (item.model as string) || 'fast';
    const upstreamModel = MODEL_MAP[effectiveModel];
    const aspectRatio = (item.aspect_ratio as string) || '16:9';
    const mode = item.first_frame_url ? 'i2v' : referenceUrls?.length ? 'ref' : 't2v';

    const veoInput: KieVeoInput = {
      prompt: item.prompt as string,
      model: upstreamModel,
      aspect_ratio: aspectRatio as KieVeoInput['aspect_ratio'],
      enableTranslation: false,
    };
    if (item.first_frame_url) veoInput.first_frame_url = item.first_frame_url as string;
    if (item.last_frame_url) veoInput.last_frame_url = item.last_frame_url as string;
    if (referenceUrls?.length) veoInput.reference_urls = referenceUrls;
    if (item.seed !== undefined) veoInput.seeds = item.seed as number;

    const dbInput: Record<string, unknown> = {
      prompt: item.prompt,
      model: effectiveModel,
      aspect_ratio: aspectRatio,
    };
    for (const key of ['first_frame_url', 'last_frame_url', 'reference_urls', 'seed']) {
      if (item[key] !== undefined) dbInput[key] = item[key];
    }

    return {
      adapterName: 'kie-veo',
      adapterInput: veoInput,
      generationType: 'video',
      innerModelId: `kie-veo31-${effectiveModel}-${mode}`,
      dbInput,
      creditDescription: `veo-3-1 ${effectiveModel}`,
    };
  },
};
