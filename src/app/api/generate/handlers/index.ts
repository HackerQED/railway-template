import { seedance15Handler } from './seedance-1-5';
import { seedance20Handler } from './seedance-2-0';
import { seedance20HumanHandler } from './seedance-2-0-human';
import { seedream45Handler } from './seedream-4-5';
import type { ModelHandler } from './types';
import { veo31Handler } from './veo-3-1';

/**
 * Handler registry — maps model ID to its handler.
 * To add a new model: create a handler file + schema, then register here.
 */
const handlers: Record<string, ModelHandler> = {
  'seedream-4-5': seedream45Handler,
  'seedance-1-5': seedance15Handler,
  'seedance-2-0': seedance20Handler,
  'seedance-2-0-human': seedance20HumanHandler,
  'veo-3-1': veo31Handler,
};

export function getHandler(modelId: string): ModelHandler | undefined {
  return handlers[modelId];
}
