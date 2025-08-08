import { z } from 'zod';

export const weatherPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required')
});

export const weatherSchema = z.object({
  temperature: z.number(),
  condition: z.enum(['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy'])
});

export const weatherResponseSchema = z.object({
  success: z.boolean(),
  weatherData: weatherSchema
    .merge(
      z.object({
        remark: z.string()
      })
    )
    .nullable(),
  error: z.string().nullable()
});
