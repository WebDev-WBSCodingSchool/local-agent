import type { Weather, WeatherInputDTO, WeatherResponseDTO } from '#types';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { type RequestHandler } from 'express';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { weatherResponseSchema } from '#schemas';
import { getWeather, returnError } from '#utils';

export const getCurrentWeather: RequestHandler<{}, WeatherResponseDTO, WeatherInputDTO> = async (
  req,
  res
) => {
  const { prompt } = req.body;
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
    },
    {
      type: 'function',
      function: {
        name: 'return_error',
        description: 'Return an error when the user asks something that is NOT about the weather.',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          },
          required: ['message'],
          additionalProperties: false
        }
      }
    }
  ];
  // Step 2: Create OpenAI client, during development will use a local model, in production it will use the OpenAI API
  const client = new OpenAI({
    baseURL: process.env.NODE_ENV === 'development' ? process.env.LOCAL_BASE_URL! : undefined,
    apiKey:
      process.env.NODE_ENV === 'development'
        ? process.env.LOCAL_API_KEY
        : process.env.OPENAI_API_KEY
  });
  // Step 3: Set model, during development, we use a specific local model, in production we use the OpenAI model
  const model =
    process.env.NODE_ENV === 'development'
      ? process.env.LOCAL_MODEL_ID!
      : process.env.OPENAI_MODEL_ID!;
  // Step 4: Create a running message list we will add to over time
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'developer',
      content: `You are a strict weather assistant.
      • If the user asks for the weather in a city, CALL the "get_weather" tool
      with the city's name.
      • Otherwise CALL the "return_error" tool with a short message like "Sorry, I can only answer weather questions."
      Respond ONLY by calling one of those two tools.`
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
    let result: Weather | WeatherResponseDTO | undefined;
    // Step 9: Call your local function
    if (functionName === 'get_weather') {
      result = await getWeather(functionArgs);
    } else if (functionName === 'return_error') {
      result = await returnError(functionArgs);
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
