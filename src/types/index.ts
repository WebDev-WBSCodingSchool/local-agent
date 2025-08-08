import { z } from 'zod';
import { weatherPromptSchema, weatherResponseSchema, weatherSchema } from '#schemas';

export type WeatherInputDTO = z.infer<typeof weatherPromptSchema>;
export type WeatherResponseDTO = z.infer<typeof weatherResponseSchema>;
export type Weather = z.infer<typeof weatherSchema>;
