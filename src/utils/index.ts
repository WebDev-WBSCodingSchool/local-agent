import { z } from 'zod';
import { weatherSchema } from '#schemas';

type Weather = z.infer<typeof weatherSchema>;

// Local functions for AI agent operations

export const getWeather = async ({ city }: { city: string }): Promise<Weather> => {
  console.log(`Fetching weather for city: ${city}`);
  const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy'] as const;
  const response = {
    temperature: Math.floor(Math.random() * 30) + 1, // Random temperature between 1 and 30
    condition: conditions[Math.floor(Math.random() * conditions.length)] || 'sunny'
  };
  return response;
};
