import { z } from 'zod';

export const seedance20HumanInputSchema = z.object({
  prompt: z.string().min(1),
  aspect_ratio: z
    .enum(['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', 'adaptive'])
    .optional(),
  resolution: z.enum(['480p', '720p']).optional(),
  duration: z.coerce.number().min(4).max(15).optional(),
  media_urls: z.array(z.string().url()).min(1).max(12).optional(),
  real_person_flags: z.record(z.string(), z.boolean()).optional(),
  comment: z.string().max(500).optional(),
});

export type Seedance20HumanInput = z.infer<typeof seedance20HumanInputSchema>;
