import { z } from 'zod';

export const seedance15InputSchema = z
  .object({
    prompt: z.string().min(1),
    image: z.string().url().optional(),
    last_image: z.string().url().optional(),
    video: z.string().url().optional(),
    aspect_ratio: z
      .enum(['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'])
      .optional(),
    resolution: z.enum(['480p', '720p', '1080p']).optional(),
    duration: z.coerce.number().min(4).max(12).optional(),
    seed: z.coerce.number().int().min(-1).max(2147483647).optional(),
    fast: z
      .preprocess((v) => v === true || v === 'true', z.boolean())
      .default(true),
    generate_audio: z
      .preprocess((v) => v === true || v === 'true', z.boolean())
      .optional(),
    camera_fixed: z
      .preprocess((v) => v === true || v === 'true', z.boolean())
      .optional(),
    comment: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.image && data.video) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'cannot specify both image and video',
        path: ['video'],
      });
    }
    if (data.last_image && !data.image) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'last_image requires image',
        path: ['last_image'],
      });
    }
    if (data.aspect_ratio && data.video) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'aspect_ratio is not available in video extend mode',
        path: ['aspect_ratio'],
      });
    }
    if (data.resolution === '480p' && data.fast !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '480p is not available in fast mode',
        path: ['resolution'],
      });
    }
  });

export type Seedance15Input = z.infer<typeof seedance15InputSchema>;
