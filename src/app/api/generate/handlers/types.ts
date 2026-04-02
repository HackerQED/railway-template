import type { ModelConfig } from '@/config/models';

/**
 * Each model implements this interface. The unified route handler
 * calls these methods in order: normalize → validate → resolveCost → submit.
 */
export interface ModelHandler {
  /** Coerce frontend string values to proper types (optional) */
  normalize?(item: Record<string, unknown>): Record<string, unknown>;
  /** Validate a single item. Return error string or null. */
  validate(item: Record<string, unknown>, prefix: string): string | null;
  /** Compute credit cost for a single item */
  resolveCost(config: ModelConfig, item: Record<string, unknown>): number;
  /** Submit one generation. Returns adapter taskId + DB input + metadata. */
  submit(
    item: Record<string, unknown>,
    index: number
  ): Promise<SubmitResult>;
}

export interface SubmitResult {
  adapterName: string;
  adapterInput: Record<string, unknown>;
  generationType: 'image' | 'video';
  innerModelId: string;
  dbInput: Record<string, unknown>;
  creditDescription: string;
}
