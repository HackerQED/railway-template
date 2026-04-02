import { z } from 'zod';

export const veo31InputSchema = z
  .object({
    prompt: z.string().min(1),
    aspect_ratio: z.enum(['16:9', '9:16', 'auto']).optional(),
    model: z.enum(['fast', 'standard']).default('fast'),
    first_frame_url: z.string().url().optional(),
    last_frame_url: z.string().url().optional(),
    reference_urls: z.array(z.string().url()).min(1).max(3).optional(),
    seed: z.number().int().min(10000).max(99999).optional(),
    comment: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.first_frame_url && data.reference_urls?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'cannot use both first_frame_url and reference_urls',
        path: ['reference_urls'],
      });
    }
    if (data.last_frame_url && !data.first_frame_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'last_frame_url requires first_frame_url',
        path: ['last_frame_url'],
      });
    }
  });

export type Veo31Input = z.infer<typeof veo31InputSchema>;
