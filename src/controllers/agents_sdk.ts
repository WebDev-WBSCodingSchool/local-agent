import type { WeatherInputDTO, WeatherResponseDTO } from '#types';
import { type RequestHandler } from 'express';
import OpenAI from 'openai';
import {
  Agent,
  OpenAIChatCompletionsModel,
  run,
  setDefaultOpenAIClient,
  tool
} from '@openai/agents';
import { z } from 'zod';
import { weatherResponseSchema } from '#schemas';
import { getWeather } from '#utils';

export const getCurrentWeather: RequestHandler<{}, WeatherResponseDTO, WeatherInputDTO> = async (
  req,
  res
) => {
  const { prompt } = req.body;
  // Step 1: Define a list of callable tools for the model
  const getWeatherTool = tool({
    name: 'get_weather',
    description: 'Get current temperature for a given location.',
    parameters: z.object({ city: z.string() }),
    execute: getWeather
  });

  const errorTool = tool({
    name: 'return_error',
    description: 'Return an error when the user asks something that is NOT about the weather.',
    parameters: z.object({ message: z.string() }),
    execute: ({ message }) =>
      ({ success: false, weatherData: null, error: message } satisfies WeatherResponseDTO)
  });
  // Step 2: Create OpenAI client, during development we use LM Studio's base URL
  const client = new OpenAI({
    baseURL: process.env.NODE_ENV === 'development' ? process.env.LOCAL_BASE_URL! : undefined,
    apiKey:
      process.env.NODE_ENV === 'development'
        ? process.env.LOCAL_API_KEY
        : process.env.OPENAI_API_KEY
  });
  setDefaultOpenAIClient(client);
  // Step 3: Set model, during development, we use a specific local model, otherwise we default to 'gpt-5'
  const model =
    process.env.NODE_ENV === 'development'
      ? new OpenAIChatCompletionsModel(client, process.env.LOCAL_MODEL_ID!)
      : process.env.OPENAI_MODEL_ID!;
  const agent = new Agent({
    name: 'Weather Assistant',
    instructions: `You are a strict weather assistant.
    • If the user asks for the weather in a city, CALL the "get_weather" tool
      with the city's name.
    • Otherwise CALL the "return_error" tool with a short message like
      "Sorry, I can only answer weather questions."
    Respond ONLY by calling one of those two tools.
  `,
    model,
    tools: [errorTool, getWeatherTool],
    outputType: weatherResponseSchema,
    modelSettings: {
      toolChoice: 'required'
    }
  });
  const result = await run(agent, prompt);
  res.json(result.finalOutput);
};
