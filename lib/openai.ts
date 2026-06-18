import OpenAI from "openai";

let client: OpenAI | null = null;

/** Lazy singleton — avoids throwing at import time during `next build`. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY environment variable. Add it to .env.local or Render Environment."
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
