import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { type RequestHandler } from 'express';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { weatherPromptSchema, weatherResponseSchema, weatherSchema } from '#schemas';
import { getWeather } from '#utils';

type WeatherInputDTO = z.infer<typeof weatherPromptSchema>;
type WeatherResponseDTO = z.infer<typeof weatherResponseSchema>;
type Weather = z.infer<typeof weatherSchema>;

// Step 1: Define a list of callable tools for the model
const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current temperature for a given location.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' }
        },
        required: ['city'],
        additionalProperties: false
      }
    }
  }
];

export const getCurrentWeather: RequestHandler<{}, WeatherResponseDTO, WeatherInputDTO> = async (
  req,
  res
) => {
  const { prompt } = req.body;
  // Step 2: Create OpenAI client, during development we use LM Studio's base URL
  const client = new OpenAI({
    baseURL: process.env.NODE_ENV === 'development' ? process.env.LMS_BASE_URL! : undefined
  });
  // Step 3: Set model, during development, we use a specific local model, otherwise we default to 'gpt-5'
  const model = process.env.NODE_ENV === 'development' ? process.env.LMS_BASE_MODEL! : 'gpt-5';
  // Step 4: Create a running message list we will add to over time
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'developer',
      content: `You are a strict weather assistant. Only respond to messages about weather. If the user asks about the weather in a city, call the "get_weather" tool. Use the "remark" field in the output for any tips or insight based on the conditions and temperature For anything else, do not call any tool and reply with "I can only provide weather information."`
    },
    {
      role: 'user',
      content: prompt
    }
  ];
  // Step 5: Prompt the model with tools defined
  const completion = await client.chat.completions.create({
    model,
    tools,
    messages,
    tool_choice: 'auto'
  });
  console.log(
    `\x1b[34mFirst call to determine function calling is used model: ${completion.model}\x1b[0m`
  );
  // Step 6: Check if the model returned a valid response
  const assistantMessage = completion.choices[0]?.message;
  if (!assistantMessage) {
    res.status(500).json({ success: false, weatherData: null, error: 'Something went wrong' });
    return;
  }
  // Step 7: Add the assistant's message to the running message list
  messages.push(assistantMessage);
  // Step 8: Check if the assistant message contains a tool call
  let toolCall = assistantMessage.tool_calls?.[0];
  if (toolCall && toolCall.type === 'function') {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
    console.log(
      `\x1b[35mFunction ${functionName} will be called with: ${JSON.stringify(functionArgs)}\x1b[0m`
    );
    let result: Weather | undefined;
    // Step 9: Call your local function
    if (functionName === 'get_weather') {
      result = await getWeather(functionArgs);
    }
    // Step 10: Send function result back to message list
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(result)
    });
  } else {
    console.log(`\x1b[31mModel didn't return a valid function call, returning early\x1b[0m`);
    res.status(500).json({
      success: false,
      weatherData: null,
      error: 'Could not get reliable weather information'
    });
    return;
  }
  // Step 11: Finalize the response with the model
  const finalCompletion = await client.chat.completions.create({
    model,
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: zodTextFormat(weatherResponseSchema, 'WeatherResponse')
    }
  });
  console.log(
    `\x1b[34mSecond call to put final response together used model: ${finalCompletion.model}\x1b[0m`
  );
  const finalAssistantMessage = finalCompletion.choices[0]?.message;
  if (!finalAssistantMessage) {
    res.status(500).json({ success: false, weatherData: null, error: 'Something went wrong' });
    return;
  }
  const finalResponse = JSON.parse(finalAssistantMessage.content || '{}');
  res.json(finalResponse);
};
