import { resolveCreditCost } from '@/config/models';
import type { MaxApiInput } from '@/worker/providers/maxapi';
import type { Seedance20Input } from './schemas';
import type { ModelHandler, SubmitResult } from './types';
import { hasOmniMedia } from './utils';

export const seedance20Handler: ModelHandler<Seedance20Input> = {
  resolveCost(config, input) {
    const isOmni = hasOmniMedia(input.media_urls);
    return resolveCreditCost(
      config,
      { fast: String(input.fast ?? false) },
      isOmni
    );
  },

  async submit(input): Promise<SubmitResult> {
    const mode = input.media_urls?.length ? 'i2v' : 't2v';
    const speed = input.fast ? 'fast' : 'standard';
    const isOmni = hasOmniMedia(input.media_urls);

    const maxInput: MaxApiInput = {
      prompt: input.prompt,
      fast: input.fast ?? false,
      fallback: false,
    };
    if (input.media_urls?.length) maxInput.mediaUrls = input.media_urls;
    if (input.ratio) maxInput.ratio = input.ratio as MaxApiInput['ratio'];
    if (input.resolution)
      maxInput.resolution = input.resolution as MaxApiInput['resolution'];
    if (input.duration !== undefined) maxInput.duration = input.duration;

    const dbInput: Record<string, unknown> = { prompt: input.prompt };
    for (const key of [
      'media_urls',
      'ratio',
      'resolution',
      'duration',
      'fast',
    ] as const) {
      if (input[key] !== undefined) dbInput[key] = input[key];
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
