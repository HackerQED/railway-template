import type { ModelConfig } from '@/config/models';

/**
 * Each model implements this interface.
 * Validation is handled by the Zod schema in schemas/;
 * the handler only needs resolveCost and submit.
 */
export interface ModelHandler<T = Record<string, unknown>> {
  /** Compute credit cost for a single item */
  resolveCost(config: ModelConfig, input: T): number;
  /** Submit one generation. Returns adapter taskId + DB input + metadata. */
  submit(input: T, index: number): Promise<SubmitResult>;
}

export interface SubmitResult {
  adapterName: string;
  adapterInput: Record<string, unknown>;
  generationType: 'image' | 'video';
  innerModelId: string;
  dbInput: Record<string, unknown>;
  creditDescription: string;
}
