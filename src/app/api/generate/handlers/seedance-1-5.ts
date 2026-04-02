import { resolveCreditCost } from '@/config/models';
import type { WaveSpeedInput } from '@/worker/providers/wavespeed';
import type { Seedance15Input } from './schemas';
import type { ModelHandler, SubmitResult } from './types';

function resolveUpstreamModel(
  mode: 'i2v' | 't2v' | 'extend',
  fast: boolean
): string {
  const suffix = fast ? '-fast' : '';
  const modeMap = {
    i2v: 'image-to-video',
    t2v: 'text-to-video',
    extend: 'video-extend',
  };
  return `bytedance/seedance-v1.5-pro/${modeMap[mode]}${suffix}`;
}

export const seedance15Handler: ModelHandler<Seedance15Input> = {
  resolveCost(config, input) {
    return resolveCreditCost(config, {
      resolution: input.resolution ?? '480p',
      fast: String(input.fast ?? true),
      duration: String(input.duration ?? 5),
    });
  },

  async submit(input): Promise<SubmitResult> {
    const mode = input.video ? 'extend' : input.image ? 'i2v' : 't2v';
    const fast = input.fast ?? true;

    const wsInput: WaveSpeedInput = {
      _model: resolveUpstreamModel(mode, fast),
      prompt: input.prompt,
    };
    if (input.image) wsInput.image = input.image;
    if (input.last_image) wsInput.last_image = input.last_image;
    if (input.video) wsInput.video = input.video;
    if (input.aspect_ratio) wsInput.aspect_ratio = input.aspect_ratio;
    if (input.duration !== undefined) wsInput.duration = input.duration;
    if (input.resolution) wsInput.resolution = input.resolution;
    if (input.generate_audio !== undefined)
      wsInput.generate_audio = input.generate_audio;
    if (input.camera_fixed !== undefined)
      wsInput.camera_fixed = input.camera_fixed;
    if (input.seed !== undefined) wsInput.seed = input.seed;

    const dbInput: Record<string, unknown> = { prompt: input.prompt };
    for (const key of [
      'image',
      'last_image',
      'video',
      'aspect_ratio',
      'duration',
      'resolution',
      'generate_audio',
      'camera_fixed',
      'seed',
      'fast',
    ] as const) {
      if (input[key] !== undefined) dbInput[key] = input[key];
    }

    return {
      adapterName: 'wavespeed',
      adapterInput: wsInput,
      generationType: 'video',
      innerModelId: `wavespeed-seedance-1.5-pro-${fast ? 'fast' : 'standard'}-${mode}`,
      dbInput,
      creditDescription: `seedance-1-5 ${fast ? 'fast' : 'standard'} ${mode}`,
    };
  },
};
