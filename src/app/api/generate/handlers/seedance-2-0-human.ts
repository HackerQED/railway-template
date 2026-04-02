import { resolveCreditCost } from '@/config/models';
import type { AiVideoApiInput } from '@/worker/providers/aivideoapi';
import type { Seedance20HumanInput } from './schemas';
import type { ModelHandler, SubmitResult } from './types';
import { classifyMedia, hasOmniMedia } from './utils';

export const seedance20HumanHandler: ModelHandler<Seedance20HumanInput> = {
  resolveCost(config, input) {
    const isOmni = hasOmniMedia(input.media_urls);
    return resolveCreditCost(
      config,
      {
        resolution: input.resolution ?? '480p',
        duration: String(input.duration ?? 4),
      },
      isOmni
    );
  },

  async submit(input): Promise<SubmitResult> {
    const mode = input.media_urls?.length ? 'i2v' : 't2v';
    const isOmni = hasOmniMedia(input.media_urls);
    const resolution = input.resolution ?? '480p';

    const apiInput: AiVideoApiInput = {
      prompt: input.prompt,
      resolution: resolution as AiVideoApiInput['resolution'],
    };
    if (input.aspect_ratio)
      apiInput.aspect_ratio =
        input.aspect_ratio as AiVideoApiInput['aspect_ratio'];
    if (input.duration !== undefined) apiInput.duration = input.duration;

    if (input.media_urls?.length) {
      const { imageUrls, videoUrls, audioUrls } = classifyMedia(
        input.media_urls,
        input.real_person_flags
      );
      if (imageUrls.length) apiInput.image_urls = imageUrls;
      if (videoUrls.length) apiInput.video_urls = videoUrls;
      if (audioUrls.length) apiInput.audio_urls = audioUrls;
    }

    const dbInput: Record<string, unknown> = { prompt: input.prompt };
    for (const key of [
      'media_urls',
      'aspect_ratio',
      'resolution',
      'duration',
      'real_person_flags',
    ] as const) {
      if (input[key] !== undefined) dbInput[key] = input[key];
    }

    return {
      adapterName: 'aivideoapi',
      adapterInput: apiInput,
      generationType: 'video',
      innerModelId: `aivideoapi-seedance-2.0-${resolution}-${mode}${isOmni ? '-omni' : ''}`,
      dbInput,
      creditDescription: `seedance-2-0-human ${resolution}${isOmni ? '+omni' : ''}`,
    };
  },
};
