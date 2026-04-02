/**
 * Frontend API client for generation endpoints.
 * Uses same-origin fetch with session cookie auth.
 */

export class GenerationApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GenerationApiError';
    this.status = status;
  }
}

export interface GenerationSubmitParams {
  prompt: string;
  aspect_ratio?: string;
  quality?: string;
  model?: string;
  /** Keyframes mode: first frame URL */
  first_frame_url?: string;
  /** Keyframes mode: last frame URL (optional) */
  last_frame_url?: string;
  /** Reference mode: 1-3 reference image URLs */
  reference_urls?: string[];
  /** Seedream image editing: input images */
  image_urls?: string[];
  /** Seedance multi-media: images, videos, and audio URLs */
  media_urls?: string[];
  seed?: number;
}

export interface GenerationSubmitResult {
  task_id: string;
}

export interface GenerationStatus {
  id: string;
  type: 'image' | 'video';
  status: 'pending' | 'processing' | 'done' | 'failed';
  comment: string | null;
  output: Record<string, unknown> | null;
  error: string | { code?: string; message: string } | null;
  sortOrder: number;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Submit a generation request to a model endpoint.
 */
export async function submitGeneration(
  endpoint: string,
  params: GenerationSubmitParams
): Promise<GenerationSubmitResult> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new GenerationApiError(
      data.error || `Generation failed (${res.status})`,
      res.status
    );
  }

  return data.data as GenerationSubmitResult;
}

/**
 * Poll generation status by IDs.
 */
export async function fetchGenerationStatus(
  ids: string[]
): Promise<GenerationStatus[]> {
  const res = await fetch(
    `/api/generations/status?ids=${ids.join(',')}`,
    { method: 'GET' }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Status check failed (${res.status})`);
  }

  return data.data.generations as GenerationStatus[];
}

/**
 * Upload a file and return the hosted URL.
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }

  return data.data.url as string;
}
