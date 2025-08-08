import type { Weather, WeatherResponseDTO } from '#types';

// Local functions for AI agent operations
export const getWeather = async ({ city }: { city: string }): Promise<Weather> => {
  console.log(`\x1b[35mFunction get_weather called with: ${city}\x1b[0m`);
  const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy'] as const;
  const response = {
    temperature: Math.floor(Math.random() * 30) + 1, // Random temperature between 1 and 30
    condition: conditions[Math.floor(Math.random() * conditions.length)] || 'sunny'
  };
  console.log(`\x1b[35mFunction get_weather returning: ${JSON.stringify(response)}\x1b[0m`);
  return response;
};

export const returnError = async ({
  message
}: {
  message: string;
}): Promise<WeatherResponseDTO> => ({ success: false, weatherData: null, error: message });
