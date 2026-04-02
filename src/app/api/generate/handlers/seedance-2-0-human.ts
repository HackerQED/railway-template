import { type ModelConfig, resolveCreditCost } from '@/config/models';
import type { AiVideoApiInput } from '@/worker/providers/aivideoapi';
import type { ModelHandler, SubmitResult } from './types';
import { classifyMedia, hasOmniMedia } from './utils';

const VALID_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', 'adaptive'];
const VALID_RESOLUTIONS = ['480p', '720p'];

export const seedance20HumanHandler: ModelHandler = {
  normalize(item) {
    return {
      ...item,
      duration: item.duration != null ? Number(item.duration) : undefined,
    };
  },

  validate(item, prefix) {
    if (!item.prompt || typeof item.prompt !== 'string') return `${prefix}prompt is required (string)`;
    if (item.aspect_ratio && !VALID_RATIOS.includes(item.aspect_ratio as string)) return `${prefix}aspect_ratio invalid`;
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
    return resolveCreditCost(
      config,
      { resolution: (item.resolution as string) ?? '480p', duration: String(item.duration ?? 4) },
      isOmni
    );
  },

  async submit(item): Promise<SubmitResult> {
    const mediaUrls = item.media_urls as string[] | undefined;
    const mode = mediaUrls?.length ? 'i2v' : 't2v';
    const isOmni = hasOmniMedia(mediaUrls);
    const resolution = (item.resolution as string) ?? '480p';

    const apiInput: AiVideoApiInput = {
      prompt: item.prompt as string,
      resolution: resolution as AiVideoApiInput['resolution'],
    };
    if (item.aspect_ratio) apiInput.aspect_ratio = item.aspect_ratio as AiVideoApiInput['aspect_ratio'];
    if (item.duration !== undefined) apiInput.duration = item.duration as number;

    if (mediaUrls?.length) {
      const { imageUrls, videoUrls, audioUrls } = classifyMedia(
        mediaUrls,
        item.real_person_flags as Record<string, boolean> | undefined
      );
      if (imageUrls.length) apiInput.image_urls = imageUrls;
      if (videoUrls.length) apiInput.video_urls = videoUrls;
      if (audioUrls.length) apiInput.audio_urls = audioUrls;
    }

    const dbInput: Record<string, unknown> = { prompt: item.prompt };
    for (const key of ['media_urls', 'aspect_ratio', 'resolution', 'duration', 'real_person_flags']) {
      if (item[key] !== undefined) dbInput[key] = item[key];
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
