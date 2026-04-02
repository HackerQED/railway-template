import { resolveCreditCost } from '@/config/models';
import type { KieInput } from '@/worker/providers/kie';
import type { Seedream45Input } from './schemas';
import type { ModelHandler, SubmitResult } from './types';

export const seedream45Handler: ModelHandler<Seedream45Input> = {
  resolveCost(config) {
    return resolveCreditCost(config, {});
  },

  async submit(input): Promise<SubmitResult> {
    const model = input.image_urls?.length
      ? 'seedream/4.5-edit'
      : 'seedream/4.5-text-to-image';

    const kieInput: KieInput = {
      model,
      input: {
        prompt: input.prompt,
        aspect_ratio: input.aspect_ratio,
        quality: input.quality,
      },
    };
    if (input.image_urls?.length) kieInput.input.image_urls = input.image_urls;

    return {
      adapterName: 'kie',
      adapterInput: kieInput,
      generationType: 'image',
      innerModelId: input.image_urls?.length
        ? 'kie-seedream-4.5-edit'
        : 'kie-seedream-4.5-t2i',
      dbInput: {
        prompt: input.prompt,
        aspect_ratio: input.aspect_ratio,
        quality: input.quality,
        ...(input.image_urls?.length ? { image_urls: input.image_urls } : {}),
      },
      creditDescription: 'seedream-4-5',
    };
  },
};
