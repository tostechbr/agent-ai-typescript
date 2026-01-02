/**
 * 04-streaming.ts
 *
 * Real-time streaming responses from LLMs!
 *
 * In this file I learn how to:
 * - Stream responses token by token (like ChatGPT typing)
 * - Compare invoke() vs stream()
 * - Use streamEvents() for more control
 * - Measure time-to-first-token
 *
 * Run: npx tsx src/01-fundamentals/04-streaming.ts
 */

import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Model for streaming demos
const model = new ChatOpenAI({
  modelName: "gpt-4.1-mini",
  temperature: 0.7,
});

/**
 * Without streaming:
 *   User asks question → waits 5-10 seconds → sees full response
 *
 * With streaming:
 *   User asks question → sees first word in ~200ms → words appear progressively
 *
 * This dramatically improves perceived performance and user experience!
 */

async function demoInvokeVsStream() {
  console.log("=".repeat(60));
  console.log("DEMO 1: invoke() vs stream() Comparison");
  console.log("=".repeat(60));

  const prompt = "Write a haiku about programming.";

  // Method 1: invoke() - Wait for full response
  console.log("\n📥 Using invoke() (wait for complete response):");
  const startInvoke = Date.now();
  const response = await model.invoke([new HumanMessage(prompt)]);
  const invokeTime = Date.now() - startInvoke;

  console.log(`  Response: ${response.content}`);
  console.log(`  Total time: ${invokeTime}ms`);

  // Method 2: stream() - Get tokens as they arrive
  console.log("\n📡 Using stream() (tokens arrive progressively):");
  const startStream = Date.now();
  let firstTokenTime: number | null = null;
  let tokenCount = 0;

  process.stdout.write("  Response: ");

  const stream = await model.stream([new HumanMessage(prompt)]);

  for await (const chunk of stream) {
    // Record time to first token
    if (firstTokenTime === null) {
      firstTokenTime = Date.now() - startStream;
    }

    // Print each token as it arrives
    process.stdout.write(String(chunk.content));
    tokenCount++;
  }

  const streamTime = Date.now() - startStream;

  console.log(`\n  Time to first token: ${firstTokenTime}ms`);
  console.log(`  Total time: ${streamTime}ms`);
  console.log(`  Tokens received: ${tokenCount}`);
}

async function demoChatGPTEffect() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 2: ChatGPT-like Typing Effect");
  console.log("=".repeat(60));

  const messages = [
    new SystemMessage("You are a helpful assistant. Keep responses under 100 words."),
    new HumanMessage("Explain what an API is to a 10 year old."),
  ];

  console.log("\n🤖 Assistant is typing...\n");

  // Add a small delay between tokens for visual effect
  const stream = await model.stream(messages);

  process.stdout.write("  ");

  for await (const chunk of stream) {
    const text = String(chunk.content);
    process.stdout.write(text);

    // Small delay for typing effect (optional, for demo purposes)
    await new Promise((r) => setTimeout(r, 20));
  }

  console.log("\n");
}

async function demoCollectStream() {
  console.log("=".repeat(60));
  console.log("DEMO 3: Collecting Stream into Variable");
  console.log("=".repeat(60));

  const prompt = "Give me 3 random facts about TypeScript.";

  console.log("\nStreaming and collecting response...\n");

  let fullResponse = "";
  let chunkCount = 0;

  const stream = await model.stream([new HumanMessage(prompt)]);

  for await (const chunk of stream) {
    const text = String(chunk.content);
    fullResponse += text;
    chunkCount++;

    // Show progress indicator
    process.stdout.write(".");
  }

  console.log(` Done! (${chunkCount} chunks)\n`);
  console.log("Collected response:");
  console.log(`  ${fullResponse}`);
}

async function demoStreamWithMetadata() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 4: Streaming with Metadata");
  console.log("=".repeat(60));

  const prompt = "What is Node.js in one sentence?";

  console.log("\nStreaming with usage tracking...\n");

  process.stdout.write("  Response: ");

  const stream = await model.stream([new HumanMessage(prompt)]);

  let lastChunk: any = null;

  for await (const chunk of stream) {
    process.stdout.write(String(chunk.content));
    lastChunk = chunk;
  }

  console.log("\n");

  // The last chunk often contains usage metadata
  if (lastChunk?.usage_metadata) {
    console.log("  Usage metadata:");
    console.log(`    Input tokens: ${lastChunk.usage_metadata.input_tokens}`);
    console.log(`    Output tokens: ${lastChunk.usage_metadata.output_tokens}`);
  } else {
    console.log("  (Usage metadata available after stream completes)");
  }
}

async function demoStreamEvents() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 5: Stream Events (Advanced)");
  console.log("=".repeat(60));

  const prompt = "Say hello in 3 languages.";

  console.log("\nUsing streamEvents() for fine-grained control...\n");

  const eventStream = model.streamEvents([new HumanMessage(prompt)], {
    version: "v2",
  });

  for await (const event of eventStream) {
    if (event.event === "on_chat_model_start") {
      console.log("  🚀 Model started processing...");
    }

    if (event.event === "on_chat_model_stream") {
      // Each token as it arrives
      const token = event.data.chunk?.content;
      if (token) {
        process.stdout.write(token);
      }
    }

    if (event.event === "on_chat_model_end") {
      console.log("\n  ✅ Model finished!");
    }
  }
}

async function demoStreamErrors() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 6: Handling Stream Errors");
  console.log("=".repeat(60));

  console.log("\nDemonstrating error handling in streams...\n");

  // Example of proper error handling
  try {
    const stream = await model.stream([new HumanMessage("Say hello")]);

    process.stdout.write("  Response: ");

    for await (const chunk of stream) {
      process.stdout.write(String(chunk.content));
    }

    console.log("\n  ✅ Stream completed successfully!");
  } catch (error: any) {
    console.log(`  ❌ Stream error: ${error.message}`);

    // In production, you might:
    // - Retry the request
    // - Show a user-friendly error
    // - Log to monitoring service
  }
}

async function demoPerformanceComparison() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 7: Performance Metrics");
  console.log("=".repeat(60));

  const prompt = "Write a short paragraph about artificial intelligence.";

  // Test 1: invoke()
  const invokeStart = Date.now();
  await model.invoke([new HumanMessage(prompt)]);
  const invokeTotal = Date.now() - invokeStart;

  // Test 2: stream() - measure time to first token
  const streamStart = Date.now();
  let timeToFirstToken = 0;

  const stream = await model.stream([new HumanMessage(prompt)]);

  for await (const chunk of stream) {
    if (timeToFirstToken === 0) {
      timeToFirstToken = Date.now() - streamStart;
    }
    // Consume the rest of the stream
  }

  const streamTotal = Date.now() - streamStart;

  console.log("\n  Performance Summary:");
  console.log("  " + "-".repeat(40));
  console.log(`  invoke() total time:       ${invokeTotal}ms`);
  console.log(`  stream() time to 1st token: ${timeToFirstToken}ms`);
  console.log(`  stream() total time:        ${streamTotal}ms`);
  console.log("  " + "-".repeat(40));
  console.log(
    `  User sees content ${Math.round(invokeTotal / timeToFirstToken)}x faster with streaming!`
  );
}

async function main() {
  console.log("\n📡 LangChain Streaming Tutorial\n");

  await demoInvokeVsStream();
  await demoChatGPTEffect();
  await demoCollectStream();
  await demoStreamWithMetadata();
  await demoStreamEvents();
  await demoStreamErrors();
  await demoPerformanceComparison();

  console.log("\n" + "=".repeat(60));
  console.log("Summary: Streaming Methods");
  console.log("=".repeat(60));
  console.log(`
  | Method         | Use Case                                    |
  |----------------|---------------------------------------------|
  | invoke()       | Simple requests, batch processing           |
  | stream()       | Real-time UX, chatbots, typing effects      |
  | streamEvents() | Fine-grained control, debugging, monitoring |
  `);
  console.log("=".repeat(60));
}

main().catch(console.error);
