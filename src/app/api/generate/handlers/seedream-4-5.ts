import { type ModelConfig, resolveCreditCost } from '@/config/models';
import type { KieInput } from '@/worker/providers/kie';
import type { ModelHandler, SubmitResult } from './types';

const VALID_ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'];
const VALID_QUALITIES = ['basic', 'high'];

export const seedream45Handler: ModelHandler = {
  validate(item, prefix) {
    if (!item.prompt || typeof item.prompt !== 'string') {
      return `${prefix}prompt is required (string)`;
    }
    if (item.aspect_ratio && !VALID_ASPECT_RATIOS.includes(item.aspect_ratio as string)) {
      return `${prefix}aspect_ratio invalid: got '${item.aspect_ratio}', expected one of ${JSON.stringify(VALID_ASPECT_RATIOS)}`;
    }
    if (item.quality && !VALID_QUALITIES.includes(item.quality as string)) {
      return `${prefix}quality invalid: got '${item.quality}', expected one of ${JSON.stringify(VALID_QUALITIES)}`;
    }
    if (item.comment !== undefined && typeof item.comment === 'string' && item.comment.length > 500) {
      return `${prefix}comment must be at most 500 characters`;
    }
    if (item.image_urls !== undefined) {
      if (!Array.isArray(item.image_urls) || item.image_urls.length === 0) {
        return `${prefix}image_urls must be a non-empty array of URLs`;
      }
      if (item.image_urls.length > 14) {
        return `${prefix}image_urls supports at most 14 images`;
      }
    }
    return null;
  },

  resolveCost(config) {
    return resolveCreditCost(config, {});
  },

  async submit(item): Promise<SubmitResult> {
    const imageUrls = item.image_urls as string[] | undefined;
    const aspectRatio = (item.aspect_ratio as string) || '16:9';
    const quality = (item.quality as string) || 'basic';
    const model = imageUrls?.length ? 'seedream/4.5-edit' : 'seedream/4.5-text-to-image';

    const kieInput: KieInput = {
      model,
      input: { prompt: item.prompt as string, aspect_ratio: aspectRatio, quality },
    };
    if (imageUrls?.length) kieInput.input.image_urls = imageUrls;

    return {
      adapterName: 'kie',
      adapterInput: kieInput,
      generationType: 'image',
      innerModelId: imageUrls?.length ? 'kie-seedream-4.5-edit' : 'kie-seedream-4.5-t2i',
      dbInput: {
        prompt: item.prompt,
        aspect_ratio: aspectRatio,
        quality,
        ...(imageUrls?.length ? { image_urls: imageUrls } : {}),
      },
      creditDescription: `seedream-4-5`,
    };
  },
};
