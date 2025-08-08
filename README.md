# WBS CODING SCHOOL: Local AI Agent Development

A demonstration project showcasing how to build AI agents that can make function calls using both manual Chat Completions API and the OpenAI Agents SDK. The project exposes an Express POST endpoint that intelligently handles weather-related queries.

## Overview

This project demonstrates two different approaches to building AI agents that can:

- Determine if a prompt is weather-related
- Decide when and which function to call between `getWeather` and `returnError`
- Compose intelligent responses based on function call results

The Express server exposes a single endpoint at `/agents/weather` that accepts a JSON body with a `prompt` field and returns structured weather responses or appropriate error messages.

## Implementation Approaches

### 1. Manual Chat Completions (`src/controllers/agents_manual.ts`)

This implementation manually orchestrates Chat Completions requests by:

- Composing subsequent API calls
- Appending function call outputs when relevant
- Using the Chat Completions API for broader compatibility

**Why Chat Completions?** Most third-party compatible APIs and providers (like Ollama, LM Studio, or Gemini) support Chat Completions but not the newer Responses API.

### 2. Agents SDK (`src/controllers/agents_sdk.ts`)

This implementation uses the OpenAI Agents SDK for a more streamlined approach:

- Leverages `OpenAIChatCompletionsModel` for dev mode compatibility
- Provides built-in agent orchestration
- Requires OpenAI API key for tracing agent flow (view traces at [OpenAI Platform Traces](https://platform.openai.com/logs?api=traces))

## Function Calling Strategy

Both implementations enforce **required function calls** to ensure reliable behavior across different model capabilities. This approach works well because:

- Frontier models (OpenAI, Google, Anthropic) excel at function calling
- Smaller local models need guidance through required calls
- Combined with good prompts and fallback error functions, the flow remains robust

## Getting Started

### Prerequisites

- Node.js v24 to run TypeScript natively.
  - You can use v22 but you'd need to modify the `dev` command in `package.json`
- A local LLM setup ([Ollama](https://ollama.com/) or [LM Studio recommended](https://lmstudio.ai/)) or OpenAI API access

### Installation

1. Clone the repository:

```bash
git clone git@github.com:WebDev-WBSCodingSchool/local-agent.git
cd local-agent
```

2. Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env.development.local` file with the following variables:

```env
NODE_ENV=development
OPENAI_API_KEY=your_openai_key_here
LOCAL_BASE_URL=http://127.0.0.1:1234/v1
LOCAL_MODEL_ID=meta-llama-3.1-8b-instruct
LOCAL_API_KEY=your_local_api_key_if_needed
```

**Environment Variables Explained:**

- `OPENAI_API_KEY`: Only needed for tracing Agent Flow when using the SDK approach
- `LOCAL_BASE_URL`: Your local LLM server endpoint (LM Studio default shown)
- `LOCAL_MODEL_ID`: The model identifier in your local setup
- `LOCAL_API_KEY`: Only required if your local model server needs authentication

### Recommended Local LLM Setup

**LM Studio Configuration:**

- **Recommended Model**: [mlx-community/Meta-Llama-3.1-8B-Instruct-8bit](https://huggingface.co/mlx-community/Meta-Llama-3.1-8B-Instruct-8bit)
- **Model ID**: `meta-llama-3.1-8b-instruct`
- **Base URL**: `http://127.0.0.1:1234/v1`

**System Requirements:**

- Tested on MacBook Air M4 16GB
- Should work with other smaller models like [Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF)

### Third-Party Provider Support

The project initializes an OpenAI client with conditional configuration:

```typescript
const client = new OpenAI({
  baseURL: process.env.NODE_ENV === 'development' ? process.env.LOCAL_BASE_URL! : undefined,
  apiKey:
    process.env.NODE_ENV === 'development' ? process.env.LOCAL_API_KEY : process.env.OPENAI_API_KEY
});
```

This setup makes it possible to integrate other providers like Gemini by adjusting the base URL and authentication.

## Usage

### Starting the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reload enabled.

### Switching Between Implementations

Toggle between manual and SDK implementations by modifying `src/controllers/index.ts`:

```typescript
// Use SDK approach (default)
export * from './agents_sdk.ts';
// export * from './agents_manual.ts';

// Use manual approach
// export * from './agents_sdk.ts';
export * from './agents_manual.ts';
```

### API Examples

**Non-weather query:**

```bash
curl --location 'http://localhost:3000/agents/weather' \
--header 'Content-Type: application/json' \
--data '{
    "prompt": "Do you know about the Mexican Revolution?"
}'
```

Response:

```json
{
  "success": false,
  "weatherData": null,
  "error": "Sorry, I can only answer weather questions."
}
```

**Weather query:**

```bash
curl --location 'http://localhost:3000/agents/weather' \
--header 'Content-Type: application/json' \
--data '{
    "prompt": "Do you know the weather info for Veracruz?"
}'
```

Response:

```json
{
  "success": true,
  "weatherData": {
    "temperature": 22,
    "condition": "sunny",
    "remark": "Sunny with a high of 22°C."
  },
  "error": ""
}
```

## Project Structure

```
src/
├── app.ts                    # Express server setup
├── controllers/
│   ├── agents_manual.ts      # Manual Chat Completions implementation
│   ├── agents_sdk.ts         # Agents SDK implementation
│   └── index.ts              # Controller exports (toggle implementations here)
├── middlewares/              # Express middlewares
├── routes/                   # Express routes
├── schemas/                  # Zod validation schemas
├── types/                    # TypeScript type definitions
└── utils/                    # Utility functions
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to dist/
- `npm start` - Run production build
- `npm run prebuild` - Clean dist directory

## Technologies Used

- **Express.js** - Web framework
- **TypeScript** - Type safety and development experience
- **OpenAI SDK** - AI model integration
- **@openai/agents** - Agent orchestration (SDK approach)
- **Zod** - Runtime type validation

## Contributing

This is an educational project for WBS Coding School. Feel free to experiment with different models, implementations, or extend the functionality.

## License

Educational use - WBS Coding School
