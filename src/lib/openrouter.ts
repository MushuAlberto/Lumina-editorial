/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from 'openai';

let openRouterClient: OpenAI | null = null;

export function getOpenRouter() {
  if (!openRouterClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing. Please set it in your environment variables.");
    }
    
    openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        "HTTP-Referer": window.location.href, // Required by OpenRouter for free models
        "X-Title": "Lumina Editorial Studio",
      }
    });
  }
  return openRouterClient;
}

export const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
