import * as dotenv from "dotenv";

import { OpenAI } from "openai";
import { RateLimiter } from "./rate-limiter.ts";

// Load environment variables
dotenv.config();

export function initGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  const rateLimit = process.env.GEMINI_RATE_LIMIT;

  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY not found in environment variables");
    process.exit(1);
  }
  if (!rateLimit) {
    console.error(
      "Error: GEMINI_RATE_LIMIT not found in environment variables"
    );
    process.exit(1);
  }

  // Create OpenAI client
  const client = new OpenAI({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });

  // Create rate limiter with 5 requests per minute (Gemini's limit)
  const rateLimiter = new RateLimiter(Number(rateLimit));

  // Return wrapped client with rate limiting
  return {
    chat: {
      completions: {
        create: (params: any) =>
          rateLimiter.schedule(() => client.chat.completions.create(params)),
      },
    },
  };
}
