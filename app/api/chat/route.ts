import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { functions, runFunction } from './functions';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI();

// Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages,
    functions: functions,
    function_call: 'auto'
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    experimental_onFunctionCall: async ({ name, arguments: args }, createFunctionCallMessages) => {
      const result = await runFunction(name, args);

      const newMessages = createFunctionCallMessages(result);
      return openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        stream: true,
        messages: [...messages, ...newMessages]
      });
    }
  });
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
