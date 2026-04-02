import { z } from 'zod';

export const seedance20InputSchema = z.object({
  prompt: z.string().min(1),
  ratio: z.enum(['1:1', '4:3', '3:4', '16:9', '9:16']).optional(),
  resolution: z.enum(['480p', '720p', '1080p']).optional(),
  duration: z.coerce.number().min(4).max(15).optional(),
  fast: z
    .preprocess((v) => v === true || v === 'true', z.boolean())
    .default(false),
  media_urls: z.array(z.string().url()).min(1).max(12).optional(),
  comment: z.string().max(500).optional(),
});

export type Seedance20Input = z.infer<typeof seedance20InputSchema>;
