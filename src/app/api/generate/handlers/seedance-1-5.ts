import { type ModelConfig, resolveCreditCost } from '@/config/models';
import type { WaveSpeedInput } from '@/worker/providers/wavespeed';
import type { ModelHandler, SubmitResult } from './types';

const VALID_RATIOS = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'];
const VALID_RESOLUTIONS = ['480p', '720p', '1080p'];

function resolveUpstreamModel(mode: 'i2v' | 't2v' | 'extend', fast: boolean): string {
  const suffix = fast ? '-fast' : '';
  const modeMap = { i2v: 'image-to-video', t2v: 'text-to-video', extend: 'video-extend' };
  return `bytedance/seedance-v1.5-pro/${modeMap[mode]}${suffix}`;
}

export const seedance15Handler: ModelHandler = {
  normalize(item) {
    return {
      ...item,
      duration: item.duration != null ? Number(item.duration) : undefined,
      seed: item.seed != null ? Number(item.seed) : undefined,
      fast: item.fast === true || item.fast === 'true',
      generate_audio: item.generate_audio === undefined ? undefined : item.generate_audio === true || item.generate_audio === 'true',
      camera_fixed: item.camera_fixed === undefined ? undefined : item.camera_fixed === true || item.camera_fixed === 'true',
    };
  },

  validate(item, prefix) {
    if (!item.prompt || typeof item.prompt !== 'string') return `${prefix}prompt is required (string)`;
    if (item.image && item.video) return `${prefix}cannot specify both image and video — use image for i2v, video for extend`;
    if (item.last_image && !item.image) return `${prefix}last_image requires image (only available in image-to-video mode)`;
    if (item.aspect_ratio) {
      if (!VALID_RATIOS.includes(item.aspect_ratio as string)) return `${prefix}aspect_ratio invalid`;
      if (item.video) return `${prefix}aspect_ratio is not available in video extend mode`;
    }
    if (item.resolution && !VALID_RESOLUTIONS.includes(item.resolution as string)) return `${prefix}resolution invalid`;
    if (item.resolution === '480p' && item.fast !== false) return `${prefix}480p is not available in fast mode`;
    if (item.duration !== undefined) {
      if (typeof item.duration !== 'number' || item.duration < 4 || item.duration > 12) return `${prefix}duration must be 4-12`;
    }
    if (item.seed !== undefined) {
      if (typeof item.seed !== 'number' || item.seed < -1 || item.seed > 2147483647) return `${prefix}seed must be -1 or 0-2147483647`;
    }
    if (item.comment !== undefined && typeof item.comment === 'string' && item.comment.length > 500) return `${prefix}comment too long`;
    return null;
  },

  resolveCost(config, item) {
    return resolveCreditCost(config, {
      resolution: (item.resolution as string) ?? '480p',
      fast: String(item.fast ?? true),
      duration: String(item.duration ?? 5),
    });
  },

  async submit(item): Promise<SubmitResult> {
    const mode = item.video ? 'extend' : item.image ? 'i2v' : 't2v';
    const fast = (item.fast as boolean) ?? true;

    const wsInput: WaveSpeedInput = {
      _model: resolveUpstreamModel(mode as 'i2v' | 't2v' | 'extend', fast),
      prompt: item.prompt as string,
    };
    if (item.image) wsInput.image = item.image as string;
    if (item.last_image) wsInput.last_image = item.last_image as string;
    if (item.video) wsInput.video = item.video as string;
    if (item.aspect_ratio) wsInput.aspect_ratio = item.aspect_ratio as string;
    if (item.duration !== undefined) wsInput.duration = item.duration as number;
    if (item.resolution) wsInput.resolution = item.resolution as string;
    if (item.generate_audio !== undefined) wsInput.generate_audio = item.generate_audio as boolean;
    if (item.camera_fixed !== undefined) wsInput.camera_fixed = item.camera_fixed as boolean;
    if (item.seed !== undefined) wsInput.seed = item.seed as number;

    const dbInput: Record<string, unknown> = { prompt: item.prompt };
    for (const key of ['image', 'last_image', 'video', 'aspect_ratio', 'duration', 'resolution', 'generate_audio', 'camera_fixed', 'seed', 'fast']) {
      if (item[key] !== undefined) dbInput[key] = item[key];
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
