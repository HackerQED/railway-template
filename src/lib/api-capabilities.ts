/**
 * Single source of truth for all agent-facing API capabilities.
 * llms.txt, /api/agent/capabilities, and SKILL.md all derive from this.
 * API docs are served by Fumadocs from content/docs/*.mdx.
 *
 * Key = endpoint path. Route files use getDoc(endpoint) to get the doc URL.
 */

export interface ModelCapability {
  kind: 'model';
  name: string;
  summary: string;
  tags: string[];
  endpoint: string;
  doc: string;
  method: 'POST';
  async: true;
}

export interface ToolCapability {
  kind: 'tool';
  name: string;
  summary: string;
  tags: string[];
  method: string;
  endpoint: string;
  doc: string;
  async: boolean;
}

export type Capability = ModelCapability | ToolCapability;

const CAPABILITIES_MAP = {
  // Models
  '/api/agent/models/seedream-4-5': {
    kind: 'model',
    name: 'seedream-4-5',
    summary: 'ByteDance image generation model',
    tags: ['text-to-image', 'image-editing'],
    endpoint: '/api/agent/models/seedream-4-5',
    doc: '/docs/models/seedream-4-5.mdx',
    method: 'POST',
    async: true,
  },
  '/api/agent/models/veo-3-1': {
    kind: 'model',
    name: 'veo-3-1',
    summary: 'Google video generation model',
    tags: ['text-to-video', 'image-to-video'],
    endpoint: '/api/agent/models/veo-3-1',
    doc: '/docs/models/veo-3-1.mdx',
    method: 'POST',
    async: true,
  },
  '/api/agent/models/seedance-1-5': {
    kind: 'model',
    name: 'seedance-1-5',
    summary:
      'Seedance 1.5 Pro — video generation with native audio, image-to-video, and video extend',
    tags: ['text-to-video', 'image-to-video', 'video-extend'],
    endpoint: '/api/agent/models/seedance-1-5',
    doc: '/docs/models/seedance-1-5.mdx',
    method: 'POST',
    async: true,
  },
  '/api/agent/models/seedance-2-0': {
    kind: 'model',
    name: 'seedance-2-0',
    summary: 'Video generation model with text-to-video and image-to-video',
    tags: ['text-to-video', 'image-to-video'],
    endpoint: '/api/agent/models/seedance-2-0',
    doc: '/docs/models/seedance-2-0.mdx',
    method: 'POST',
    async: true,
  },
  '/api/agent/models/seedance-2-0-human': {
    kind: 'model',
    name: 'seedance-2-0-human',
    summary:
      'Seedance 2.0 — video generation with real-person support via direct API',
    tags: ['text-to-video', 'image-to-video', 'real-person'],
    endpoint: '/api/agent/models/seedance-2-0-human',
    doc: '/docs/models/seedance-2-0-human.mdx',
    method: 'POST',
    async: true,
  },

  // Tools
  // NOTE: music-analyze and video-compose are mocked — hidden from discovery until real implementation lands.
  '/api/agent/upload': {
    kind: 'tool',
    name: 'upload',
    summary: 'Upload files (images, audio) for use with other endpoints',
    tags: ['utility'],
    method: 'POST',
    endpoint: '/api/agent/upload',
    doc: '/docs/tools/upload.mdx',
    async: false,
  },
  '/api/agent/generations/status': {
    kind: 'tool',
    name: 'generations-status',
    summary: 'Poll async generation task status and results',
    tags: ['utility'],
    method: 'GET',
    endpoint: '/api/agent/generations/status',
    doc: '/docs/tools/generations.mdx',
    async: false,
  },
  '/api/agent/projects': {
    kind: 'tool',
    name: 'projects',
    summary: 'Create and manage projects — containers for related generations',
    tags: ['project'],
    method: 'POST',
    endpoint: '/api/agent/projects',
    doc: '/docs/tools/projects.mdx',
    async: false,
  },
  '/api/agent/projects/:id/preview': {
    kind: 'tool',
    name: 'preview',
    summary:
      'Create structured preview pages for projects — PUT to replace, PATCH to append blocks',
    tags: ['project'],
    method: 'PUT',
    endpoint: '/api/agent/projects/:id/preview',
    doc: '/docs/tools/preview.mdx',
    async: false,
  },
} as const satisfies Record<string, Capability>;

type Endpoint = keyof typeof CAPABILITIES_MAP;

/**
 * Get the doc URL for an endpoint. Compile-time safe.
 */
export function getDoc(endpoint: Endpoint): string {
  return CAPABILITIES_MAP[endpoint].doc;
}

/**
 * All capabilities as an array — for /api/agent/capabilities and llms.txt.
 */
export const CAPABILITIES: Capability[] = Object.values(CAPABILITIES_MAP);
