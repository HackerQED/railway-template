import { storageUrl } from '@/config/storage';

/**
 * Model registry — single source of truth for all model configurations.
 *
 * To add a new model:
 * 1. Add entry to MODELS array below
 * 2. Sidebar navigation auto-generates from this config
 * 3. Dynamic route /models/[slug] auto-renders the model page
 */

export type MediaType = 'image' | 'video' | 'audio';

export type GenerationMode = {
  id: string;
  label: string;
  requiresImageUpload: boolean;
  maxImages?: number;
  /** When set, the mode accepts multiple media types (image/video/audio) */
  acceptedMediaTypes?: MediaType[];
  /** Max total media items (across all types) */
  maxMedia?: number;
  /** Show per-image real-person toggle (for models that support it) */
  showRealPerson?: boolean;
};

export type ModelParam = {
  id: string;
  label: string;
  type: 'select' | 'toggle' | 'number';
  options?: {
    value: string;
    label: string;
    /** Hide this option when another param has a specific value, e.g. { fast: 'true' } */
    hideWhen?: Record<string, string>;
  }[];
  default: string | number;
  min?: number;
  max?: number;
  /** Show a tooltip indicating this param affects pricing */
  affectsPrice?: boolean;
};

/**
 * Custom pricing function type.
 * Receives current parameter values and omni-media flag,
 * returns the credit cost for one generation.
 */
export type ResolveCostFn = (
  params: Record<string, string>,
  hasOmniMedia?: boolean
) => number;

export type ModelConfig = {
  /** Unique identifier, matches API path segment */
  id: string;
  /** Display name */
  name: string;
  /** Short description for info bar */
  description: string;
  /** Category for sidebar grouping */
  category: 'video' | 'image' | 'music';
  /** URL slug for /models/[slug] */
  slug: string;
  /** Icon image path in /public/icons/ */
  icon: string;
  /** Tags displayed as badges */
  tags: string[];
  /** Generation modes this model supports */
  modes: GenerationMode[];
  /** Model-specific parameters */
  params: ModelParam[];
  /** Default credits per generation (used when resolveCost is not defined) */
  creditCost: number;
  /** Custom pricing function — overrides creditCost when present */
  resolveCost?: ResolveCostFn;
  /** Whether this model is featured (shown with badge in sidebar) */
  featured?: boolean;
  /** Sample media URL shown in generator idle state */
  sampleMedia?: string;
  /**
   * Channel label for models that share the same slug.
   * When multiple models have the same slug, a ChannelSelector appears.
   */
  channelLabel?: string;
  /** Short description shown in the channel selector */
  channelDescription?: string;
  /** Estimated generation time shown next to credit cost, e.g. "8–10 min" */
  estimatedTime?: string;
};

export const MODELS: ModelConfig[] = [
  {
    id: 'seedream-4-5',
    name: 'Seedream 4.5',
    description:
      'Advanced AI image generation model with photorealistic output and creative style control.',
    category: 'image',
    slug: 'seedream-4-5',
    icon: '/icons/bytedance.png',
    tags: ['Text to Image', 'Image Editing'],
    modes: [
      {
        id: 'image-editing',
        label: 'Image Editing',
        requiresImageUpload: true,
        maxImages: 14,
      },
      {
        id: 'text-to-image',
        label: 'Text to Image',
        requiresImageUpload: false,
      },
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'toggle',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '2:3', label: '2:3' },
          { value: '3:2', label: '3:2' },
          { value: '21:9', label: '21:9' },
        ],
        default: '16:9',
      },
      {
        id: 'quality',
        label: 'Quality',
        type: 'toggle',
        options: [
          { value: 'basic', label: 'Basic' },
          { value: 'high', label: 'High' },
        ],
        default: 'basic',
      },
    ],
    creditCost: 10,
    sampleMedia: storageUrl('/sample/seedream4.5-1.png'),
  },
  {
    id: 'seedance-2-0-human',
    name: 'Seedance 2.0',
    description:
      'Seedance 2.0 with real-person support — direct API, half price.',
    category: 'video',
    slug: 'seedance-2-0',
    icon: '/icons/bytedance.png',
    tags: ['Text to Video', 'Image to Video', 'Real Person'],
    featured: true,
    modes: [
      {
        id: 'video-generation',
        label: 'Video Generation',
        requiresImageUpload: false,
        maxImages: 9,
        acceptedMediaTypes: ['image', 'video', 'audio'],
        maxMedia: 12,
        showRealPerson: true,
      },
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'toggle',
        options: [
          { value: 'adaptive', label: 'Auto' },
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '21:9', label: '21:9' },
        ],
        default: 'adaptive',
      },
      {
        id: 'resolution',
        label: 'Resolution',
        type: 'toggle',
        options: [
          { value: '480p', label: '480p' },
          { value: '720p', label: '720p' },
        ],
        default: '480p',
        affectsPrice: true,
      },
      {
        id: 'duration',
        label: 'Duration (s)',
        type: 'number',
        default: 4,
        min: 4,
        max: 15,
        affectsPrice: true,
      },
    ],
    creditCost: 120,
    resolveCost: (p, omni) => {
      // 1 our credit = upstream cost / 2 in dollars, but credit count matches upstream
      // 480p: 30 cr/s, 720p: 60 cr/s; with video ref: 2x
      const ratePerSecond = p.resolution === '480p' ? 30 : 60;
      const duration = Number(p.duration) || 4;
      let cost = Math.round(ratePerSecond * duration);
      if (omni) cost *= 2;
      return cost;
    },
    sampleMedia: storageUrl('/sample/seedance-2-2.mp4'),
    estimatedTime: '8–10 min',
  },
  {
    id: 'seedance-1-5',
    name: 'Seedance 1.5',
    description:
      'AI video generation with native audio, text-to-video, image-to-video, and video extend.',
    category: 'video',
    slug: 'seedance-1-5',
    icon: '/icons/bytedance.png',
    tags: ['Text to Video', 'Image to Video', 'Video Extend'],
    modes: [
      {
        id: 'text-to-video',
        label: 'Text to Video',
        requiresImageUpload: false,
      },
      {
        id: 'image-to-video',
        label: 'Image to Video',
        requiresImageUpload: true,
        maxImages: 1,
      },
      {
        id: 'video-extend',
        label: 'Video Extend',
        requiresImageUpload: true,
        maxImages: 1,
        acceptedMediaTypes: ['video'],
      },
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'toggle',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '21:9', label: '21:9' },
        ],
        default: '16:9',
      },
      {
        id: 'resolution',
        label: 'Resolution',
        type: 'toggle',
        options: [
          { value: '480p', label: '480p', hideWhen: { fast: 'true' } },
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
        ],
        default: '480p',
        affectsPrice: true,
      },
      {
        id: 'duration',
        label: 'Duration (s)',
        type: 'number',
        default: 5,
        min: 4,
        max: 12,
        affectsPrice: true,
      },
      {
        id: 'generate_audio',
        label: 'Audio',
        type: 'toggle',
        options: [
          { value: 'true', label: 'On' },
          { value: 'false', label: 'Off' },
        ],
        default: 'true',
        affectsPrice: true,
      },
      {
        id: 'fast',
        label: 'Speed',
        type: 'toggle',
        options: [
          { value: 'true', label: 'Fast' },
          { value: 'false', label: 'Standard' },
        ],
        default: 'true',
        affectsPrice: true,
      },
    ],
    creditCost: 25,
    resolveCost: (p) => {
      const rates: Record<string, number> = {
        '480p:true': 25,
        '480p:false': 40,
        '720p:true': 50,
        '720p:false': 80,
        '1080p:true': 100,
        '1080p:false': 160,
      };
      const key = `${p.resolution ?? '480p'}:${p.fast ?? 'true'}`;
      let cost = rates[key] ?? 25;
      cost = Math.round(cost * (Number(p.duration ?? 5) / 5));
      if (p.generate_audio === 'false') cost = Math.round(cost / 2);
      return cost;
    },
    sampleMedia: storageUrl('/sample/seedance-1.5-1.mp4'),
  },
  {
    id: 'veo-3-1',
    name: 'Veo 3.1',
    description:
      'State-of-the-art AI video generation with cinematic quality and precise motion control.',
    category: 'video',
    slug: 'veo-3-1',
    icon: '/icons/veo.png',
    tags: ['Keyframes', 'Reference', 'Text to Video'],
    modes: [
      {
        id: 'keyframes',
        label: 'Keyframes',
        requiresImageUpload: true,
        maxImages: 2,
      },
      {
        id: 'reference',
        label: 'Reference',
        requiresImageUpload: true,
        maxImages: 3,
      },
      {
        id: 'text-to-video',
        label: 'Text to Video',
        requiresImageUpload: false,
      },
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'toggle',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: 'auto', label: 'Auto' },
        ],
        default: '16:9',
      },
      {
        id: 'model',
        label: 'Speed',
        type: 'toggle',
        options: [
          { value: 'fast', label: 'Fast' },
          { value: 'standard', label: 'Standard' },
        ],
        default: 'fast',
        affectsPrice: true,
      },
    ],
    creditCost: 30,
    resolveCost: (p) => (p.model === 'standard' ? 200 : 30),
    sampleMedia: storageUrl('/sample/veo3.1-1.mp4'),
  },
];

/** Map for O(1) lookup by model id */
export const MODELS_MAP = new Map(MODELS.map((m) => [m.id, m]));

/** Map for O(1) lookup by slug */
export const MODELS_BY_SLUG = new Map(MODELS.map((m) => [m.slug, m]));

/** Get all models sharing a slug (channels) */
export function getChannels(slug: string): ModelConfig[] {
  return MODELS.filter((m) => m.slug === slug);
}

/** Get models by category */
export function getModelsByCategory(
  category: ModelConfig['category']
): ModelConfig[] {
  return MODELS.filter((m) => m.category === category);
}

/** All valid model slugs (for generateStaticParams) */
export function getAllModelSlugs(): string[] {
  return MODELS.map((m) => m.slug);
}

/**
 * Resolve the actual credit cost for a generation request.
 * Shared by frontend (real-time display) and backend (actual deduction).
 */
export function resolveCreditCost(
  model: ModelConfig,
  params: Record<string, string>,
  hasOmniMedia = false
): number {
  if (!model.resolveCost) return model.creditCost;
  return model.resolveCost(params, hasOmniMedia);
}
