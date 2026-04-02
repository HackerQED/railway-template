/**
 * Frontend API client for generation endpoints.
 * Uses same-origin fetch with session cookie auth.
 *
 * Input types are inferred from Zod schemas in handlers/schemas/.
 */

import type { Seedance15Input } from '@/app/api/generate/handlers/schemas/seedance-1-5';
import type { Seedance20Input } from '@/app/api/generate/handlers/schemas/seedance-2-0';
import type { Seedance20HumanInput } from '@/app/api/generate/handlers/schemas/seedance-2-0-human';
import type { Seedream45Input } from '@/app/api/generate/handlers/schemas/seedream-4-5';
import type { Veo31Input } from '@/app/api/generate/handlers/schemas/veo-3-1';

/** Union of all model input types */
export type GenerationInput =
  | Seedream45Input
  | Seedance15Input
  | Seedance20Input
  | Seedance20HumanInput
  | Veo31Input;

/** Map model ID → its typed input */
export interface ModelInputMap {
  'seedream-4-5': Seedream45Input;
  'seedance-1-5': Seedance15Input;
  'seedance-2-0': Seedance20Input;
  'seedance-2-0-human': Seedance20HumanInput;
  'veo-3-1': Veo31Input;
}

export class GenerationApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GenerationApiError';
    this.status = status;
  }
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
 * Submit a generation request to the unified /api/generate endpoint.
 * When modelId is a known key, input is type-checked against that model's schema.
 */
export async function submitGeneration<K extends string>(
  modelId: K,
  input: K extends keyof ModelInputMap
    ? ModelInputMap[K]
    : Record<string, unknown>
): Promise<GenerationSubmitResult> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, input }),
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
  const res = await fetch(`/api/generations/status?ids=${ids.join(',')}`, {
    method: 'GET',
  });

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
