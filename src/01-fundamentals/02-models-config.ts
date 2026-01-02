/**
 * 02-models-config.ts
 *
 * Exploring different model providers and configurations!
 *
 * In this file I learn how to:
 * - Use different providers (Anthropic, OpenAI, Google)
 * - Configure model parameters (temperature, maxTokens, etc.)
 * - Understand how parameters affect responses
 *
 * Run: npx tsx src/01-fundamentals/02-models-config.ts
 */

import "dotenv/config";

// Each provider has its own package in LangChain
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { HumanMessage } from "@langchain/core/messages";

/**
 * Anthropic (Claude)
 * - Models: claude-sonnet-4-20250514, claude-opus-4-20250514, claude-haiku-4-5-20251001
 * - Env: ANTHROPIC_API_KEY
 */
const claude = new ChatAnthropic({
  modelName: "claude-sonnet-4-20250514",
  temperature: 0,
  maxTokens: 1024,
  // Other useful options:
  // timeout: 30000,      // Request timeout in ms
  // maxRetries: 2,       // Retry on failure
});

/**
 * OpenAI (GPT)
 * - Models: gpt-5, gpt-5-mini
 * - Env: OPENAI_API_KEY
 */
const openai = new ChatOpenAI({
  modelName: "gpt-4.1-mini",
  temperature: 0,
  maxTokens: 1024,
  // Other useful options:
  // timeout: 30000,
  // maxRetries: 2,
});

/**
 * Google (Gemini)
 * - Models: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash
 * - Env: GOOGLE_API_KEY
 */
const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash", // Google uses 'model' instead of 'modelName'
  temperature: 0,
  maxOutputTokens: 1024,
  // Note: Google uses maxOutputTokens instead of maxTokens
});

/**
 * Key parameters that work across all providers:
 *
 * temperature (0-1 or 0-2 depending on provider)
 *   - 0 = Deterministic, same input → same output
 *   - 0.7 = Balanced creativity
 *   - 1+ = More random/creative
 *
 * maxTokens / maxOutputTokens
 *   - Limits the response length
 *   - 1 token ≈ 4 characters in English
 *   - Set based on your needs to control costs
 *
 * timeout
 *   - How long to wait for a response (ms)
 *   - Default varies by provider
 *
 * maxRetries
 *   - Automatic retries on transient failures
 *   - Useful for production reliability
 */

async function compareTemperatures() {
  console.log("=".repeat(60));
  console.log("TEMPERATURE COMPARISON (using OpenAI)");
  console.log("=".repeat(60));

  const prompt = "Give me a creative name for a coffee shop.";

  // Low temperature (deterministic)
  const coldModel = new ChatOpenAI({
    modelName: "gpt-4.1-mini",
    temperature: 0,
  });

  // High temperature (creative)
  const hotModel = new ChatOpenAI({
    modelName: "gpt-4.1-mini",
    temperature: 1,
  });

  console.log(`\nPrompt: "${prompt}"\n`);

  // Run the same prompt 3 times with each temperature
  console.log("Temperature 0 (deterministic):");
  for (let i = 1; i <= 3; i++) {
    const response = await coldModel.invoke([new HumanMessage(prompt)]);
    console.log(`  Run ${i}: ${response.content}`);
  }

  console.log("\nTemperature 1 (creative):");
  for (let i = 1; i <= 3; i++) {
    const response = await hotModel.invoke([new HumanMessage(prompt)]);
    console.log(`  Run ${i}: ${response.content}`);
  }
}

async function compareProviders() {
  console.log("\n" + "=".repeat(60));
  console.log("PROVIDER COMPARISON");
  console.log("=".repeat(60));

  const prompt = "What is TypeScript in exactly 10 words?";
  console.log(`\nPrompt: "${prompt}"\n`);

  // Check which API keys are available
  const providers: { name: string; model: any }[] = [];

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({ name: "Claude (Anthropic)", model: claude });
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({ name: "GPT-4o-mini (OpenAI)", model: openai });
  }

  if (process.env.GOOGLE_API_KEY) {
    providers.push({ name: "Gemini (Google)", model: gemini });
  }

  if (providers.length === 0) {
    console.log("No API keys found! Add at least one to your .env file.");
    return;
  }

  // Query each available provider
  for (const { name, model } of providers) {
    try {
      console.log(`${name}:`);
      const response = await model.invoke([new HumanMessage(prompt)]);
      console.log(`  Response: ${response.content}`);
      console.log(`  Tokens: ${response.usage_metadata?.output_tokens || "N/A"}\n`);
    } catch (error: any) {
      console.log(`  Error: ${error.message}\n`);
    }
  }
}

async function demoMaxTokens() {
  console.log("=".repeat(60));
  console.log("MAX TOKENS DEMO (using OpenAI)");
  console.log("=".repeat(60));

  const prompt = "Explain how computers work.";

  // Very limited tokens
  const shortModel = new ChatOpenAI({
    modelName: "gpt-4.1-mini",
    temperature: 0,
    maxTokens: 50, // Very short!
  });

  // More tokens
  const longModel = new ChatOpenAI({
    modelName: "gpt-4.1-mini",
    temperature: 0,
    maxTokens: 200,
  });

  console.log(`\nPrompt: "${prompt}"\n`);

  console.log("maxTokens: 50");
  const shortResponse = await shortModel.invoke([new HumanMessage(prompt)]);
  console.log(`  Response: ${shortResponse.content}`);
  console.log(`  Output tokens: ${shortResponse.usage_metadata?.output_tokens}`);

  console.log("\nmaxTokens: 200");
  const longResponse = await longModel.invoke([new HumanMessage(prompt)]);
  console.log(`  Response: ${longResponse.content}`);
  console.log(`  Output tokens: ${longResponse.usage_metadata?.output_tokens}`);
}

async function main() {
  console.log("\n Model Configuration Examples\n");

  // Demo 1: Temperature effects
  await demoMaxTokens();

  // Demo 2: Temperature comparison
  await compareTemperatures();

  // Demo 3: Compare different providers
  await compareProviders();

  console.log("=".repeat(60));
  console.log("Done! Try adding different API keys to compare providers.");
  console.log("=".repeat(60));
}

main().catch(console.error);
