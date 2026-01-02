/**
 * 01-hello-llm.ts
 *
 * My first LLM call with LangChain!
 *
 * In this file I learn how to:
 * - Connect to Claude using the LangChain SDK
 * - Send a message and receive a response
 * - Access metadata like token usage
 *
 * Run: npx tsx src/01-fundamentals/01-hello-llm.ts
 */

// First, I need to load my API key from the .env file
import "dotenv/config";

// ChatAnthropic is the LangChain wrapper for Claude
// It handles all the API communication for me
import { ChatAnthropic } from "@langchain/anthropic";

// LangChain uses typed messages - HumanMessage is what I send to the model
import { HumanMessage } from "@langchain/core/messages";

// Creating the model instance
// The SDK automatically reads ANTHROPIC_API_KEY from my environment
const model = new ChatAnthropic({
  modelName: "claude-sonnet-4-20250514",
  temperature: 0, // 0 = deterministic, 1 = more creative
});

// Creating a simple message to test
const message = new HumanMessage("Hello! What is LangChain in one sentence?");

async function main() {
  console.log("Sending message to Claude...\n");

  // invoke() sends the message array and returns the AI response
  const response = await model.invoke([message]);

  // The response object contains:
  // - content: the actual text response
  // - usage_metadata: how many tokens were used
  // - response_metadata: model info and other details
  console.log("Response:");
  console.log(response.content);

  console.log("\nMetadata:");
  console.log(`- Model: ${response.response_metadata?.model}`);
  console.log(`- Input tokens: ${response.usage_metadata?.input_tokens}`);
  console.log(`- Output tokens: ${response.usage_metadata?.output_tokens}`);
}

main().catch(console.error);
