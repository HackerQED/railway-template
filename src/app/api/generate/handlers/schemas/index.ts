import type { z } from 'zod';
import { seedance15InputSchema } from './seedance-1-5';
import { seedance20InputSchema } from './seedance-2-0';
import { seedance20HumanInputSchema } from './seedance-2-0-human';
import { seedream45InputSchema } from './seedream-4-5';
import { veo31InputSchema } from './veo-3-1';

export { seedream45InputSchema, type Seedream45Input } from './seedream-4-5';
export { seedance15InputSchema, type Seedance15Input } from './seedance-1-5';
export { seedance20InputSchema, type Seedance20Input } from './seedance-2-0';
export {
  seedance20HumanInputSchema,
  type Seedance20HumanInput,
} from './seedance-2-0-human';
export { veo31InputSchema, type Veo31Input } from './veo-3-1';

/** Schema registry — maps model ID to its Zod input schema */
// biome-ignore lint/suspicious/noExplicitAny: union of heterogeneous schemas
const schemaMap: Record<string, z.ZodType<any>> = {
  'seedream-4-5': seedream45InputSchema,
  'seedance-1-5': seedance15InputSchema,
  'seedance-2-0': seedance20InputSchema,
  'seedance-2-0-human': seedance20HumanInputSchema,
  'veo-3-1': veo31InputSchema,
};

// biome-ignore lint/suspicious/noExplicitAny: returns model-specific schema
export function getInputSchema(modelId: string): z.ZodType<any> | undefined {
  return schemaMap[modelId];
}
