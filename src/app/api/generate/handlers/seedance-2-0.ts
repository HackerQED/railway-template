import { type ModelConfig, resolveCreditCost } from '@/config/models';
import type { MaxApiInput } from '@/worker/providers/maxapi';
import type { ModelHandler, SubmitResult } from './types';
import { hasOmniMedia } from './utils';

const VALID_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'];
const VALID_RESOLUTIONS = ['480p', '720p', '1080p'];

export const seedance20Handler: ModelHandler = {
  normalize(item) {
    return {
      ...item,
      duration: item.duration != null ? Number(item.duration) : undefined,
      fast: item.fast === true || item.fast === 'true',
    };
  },

  validate(item, prefix) {
    if (!item.prompt || typeof item.prompt !== 'string') return `${prefix}prompt is required (string)`;
    if (item.ratio && !VALID_RATIOS.includes(item.ratio as string)) return `${prefix}ratio invalid`;
    if (item.resolution && !VALID_RESOLUTIONS.includes(item.resolution as string)) return `${prefix}resolution invalid`;
    if (item.duration !== undefined) {
      if (typeof item.duration !== 'number' || item.duration < 4 || item.duration > 15) return `${prefix}duration must be 4-15`;
    }
    if (item.media_urls !== undefined) {
      if (!Array.isArray(item.media_urls) || item.media_urls.length === 0) return `${prefix}media_urls must be a non-empty array`;
      if (item.media_urls.length > 12) return `${prefix}media_urls supports at most 12 items`;
    }
    if (item.comment !== undefined && typeof item.comment === 'string' && item.comment.length > 500) return `${prefix}comment too long`;
    return null;
  },

  resolveCost(config, item) {
    const isOmni = hasOmniMedia(item.media_urls as string[] | undefined);
    return resolveCreditCost(config, { fast: String(item.fast ?? false) }, isOmni);
  },

  async submit(item): Promise<SubmitResult> {
    const mode = (item.media_urls as string[] | undefined)?.length ? 'i2v' : 't2v';
    const speed = item.fast ? 'fast' : 'standard';
    const isOmni = hasOmniMedia(item.media_urls as string[] | undefined);

    const maxInput: MaxApiInput = {
      prompt: item.prompt as string,
      fast: (item.fast as boolean) ?? false,
      fallback: false,
    };
    if ((item.media_urls as string[])?.length) maxInput.mediaUrls = item.media_urls as string[];
    if (item.ratio) maxInput.ratio = item.ratio as MaxApiInput['ratio'];
    if (item.resolution) maxInput.resolution = item.resolution as MaxApiInput['resolution'];
    if (item.duration !== undefined) maxInput.duration = item.duration as number;

    const dbInput: Record<string, unknown> = { prompt: item.prompt };
    for (const key of ['media_urls', 'ratio', 'resolution', 'duration', 'fast']) {
      if (item[key] !== undefined) dbInput[key] = item[key];
    }

    return {
      adapterName: 'maxapi',
      adapterInput: maxInput,
      generationType: 'video',
      innerModelId: `maxapi-seedance-2.0-${speed}-${mode}${isOmni ? '-omni' : ''}`,
      dbInput,
      creditDescription: `seedance-2-0 ${speed}${isOmni ? '+omni' : ''}`,
    };
  },
};
