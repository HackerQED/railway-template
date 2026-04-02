import { z } from 'zod';

export const seedream45InputSchema = z.object({
  prompt: z.string().min(1),
  aspect_ratio: z
    .enum(['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'])
    .default('16:9'),
  quality: z.enum(['basic', 'high']).default('basic'),
  image_urls: z.array(z.string().url()).min(1).max(14).optional(),
  comment: z.string().max(500).optional(),
});

export type Seedream45Input = z.infer<typeof seedream45InputSchema>;
