import { resolveCreditCost } from '@/config/models';
import type { KieVeoInput } from '@/worker/providers/kie-veo';
import type { Veo31Input } from './schemas';
import type { ModelHandler, SubmitResult } from './types';

const MODEL_MAP: Record<string, KieVeoInput['model']> = {
  fast: 'veo3_fast',
  standard: 'veo3',
};

export const veo31Handler: ModelHandler<Veo31Input> = {
  resolveCost(config, input) {
    const effectiveModel = input.reference_urls?.length
      ? 'fast'
      : (input.model ?? 'fast');
    return resolveCreditCost(config, { model: effectiveModel });
  },

  async submit(input): Promise<SubmitResult> {
    const effectiveModel = input.reference_urls?.length
      ? 'fast'
      : (input.model ?? 'fast');
    const upstreamModel = MODEL_MAP[effectiveModel];
    const aspectRatio = input.aspect_ratio ?? '16:9';
    const mode = input.first_frame_url
      ? 'i2v'
      : input.reference_urls?.length
        ? 'ref'
        : 't2v';

    const veoInput: KieVeoInput = {
      prompt: input.prompt,
      model: upstreamModel,
      aspect_ratio: aspectRatio as KieVeoInput['aspect_ratio'],
      enableTranslation: false,
    };
    if (input.first_frame_url) veoInput.first_frame_url = input.first_frame_url;
    if (input.last_frame_url) veoInput.last_frame_url = input.last_frame_url;
    if (input.reference_urls?.length)
      veoInput.reference_urls = input.reference_urls;
    if (input.seed !== undefined) veoInput.seeds = input.seed;

    const dbInput: Record<string, unknown> = {
      prompt: input.prompt,
      model: effectiveModel,
      aspect_ratio: aspectRatio,
    };
    for (const key of [
      'first_frame_url',
      'last_frame_url',
      'reference_urls',
      'seed',
    ] as const) {
      if (input[key] !== undefined) dbInput[key] = input[key];
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
