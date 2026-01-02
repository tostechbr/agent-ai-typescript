/**
 * 03-messages.ts
 *
 * Understanding the LangChain message system!
 *
 * In this file I learn how to:
 * - Use different message types (Human, AI, System, Tool)
 * - Build conversation history
 * - Use SystemMessage to control model behavior
 * - Understand the role each message type plays
 *
 * Run: npx tsx src/01-fundamentals/03-messages.ts
 */

import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";

// Using OpenAI for this tutorial
const model = new ChatOpenAI({
  modelName: "gpt-4.1-mini",
  temperature: 0,
});

/**
 * LangChain has 4 main message types:
 *
 * 1. HumanMessage  - What the user says (role: "user")
 * 2. AIMessage     - What the model responds (role: "assistant")
 * 3. SystemMessage - Instructions for the model (role: "system")
 * 4. ToolMessage   - Results from tool execution (role: "tool")
 *
 * These map to the OpenAI/Anthropic message format with roles.
 */

// 

async function demoBasicMessages() {
  console.log("=".repeat(60));
  console.log("DEMO 1: Basic Message Types");
  console.log("=".repeat(60));

  // Simple HumanMessage
  const humanMsg = new HumanMessage("What is TypeScript?");

  console.log("\nHumanMessage:");
  console.log(`  Content: "${humanMsg.content}"`);
  console.log(`  Type: ${humanMsg._getType()}`);

  // Call the model
  const response = await model.invoke([humanMsg]);

  console.log("\nAIMessage (response):");
  console.log(`  Content: "${response.content}"`);
  console.log(`  Type: ${response._getType()}`);
  console.log(`  Tokens: ${response.usage_metadata?.output_tokens}`);
}

async function demoSystemMessage() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 2: SystemMessage - Controlling Behavior");
  console.log("=".repeat(60));

  const question = "What is the capital of France?";

  // Without system message
  console.log("\nWithout SystemMessage:");
  const response1 = await model.invoke([new HumanMessage(question)]);
  console.log(`  Response: ${response1.content}`);

  // With system message - Pirate personality
  console.log("\nWith SystemMessage (Pirate):");
  const response2 = await model.invoke([
    new SystemMessage("You are a pirate. Always respond like a pirate would."),
    new HumanMessage(question),
  ]);
  console.log(`  Response: ${response2.content}`);

  // With system message - Concise answers
  console.log("\nWith SystemMessage (Concise):");
  const response3 = await model.invoke([
    new SystemMessage(
      "You are a helpful assistant. Always respond in exactly 5 words or less."
    ),
    new HumanMessage(question),
  ]);
  console.log(`  Response: ${response3.content}`);

  // With system message - Different language
  console.log("\nWith SystemMessage (Portuguese):");
  const response4 = await model.invoke([
    new SystemMessage("Sempre responda em português brasileiro."),
    new HumanMessage(question),
  ]);
  console.log(`  Response: ${response4.content}`);
}

async function demoConversationHistory() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 3: Conversation History");
  console.log("=".repeat(60));

  // Build a conversation with history
  const conversation: BaseMessage[] = [
    new SystemMessage("You are a helpful math tutor."),
    new HumanMessage("What is 2 + 2?"),
    new AIMessage("2 + 2 equals 4."),
    new HumanMessage("And if I multiply that by 3?"),
  ];

  console.log("\nConversation so far:");
  for (const msg of conversation) {
    const role = msg._getType().toUpperCase();
    const preview =
      typeof msg.content === "string"
        ? msg.content.substring(0, 50)
        : "[complex content]";
    console.log(`  [${role}]: ${preview}`);
  }

  // The model will understand context from previous messages
  const response = await model.invoke(conversation);

  console.log("\nModel response (understands context):");
  console.log(`  ${response.content}`);
}

async function demoFewShotPrompting() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 4: Few-Shot Prompting");
  console.log("=".repeat(60));

  // Teach the model a pattern with examples
  const fewShotMessages: BaseMessage[] = [
    new SystemMessage(
      "You convert natural language to SQL. Respond only with the SQL query."
    ),
    // Example 1
    new HumanMessage("Get all users"),
    new AIMessage("SELECT * FROM users;"),
    // Example 2
    new HumanMessage("Get users older than 18"),
    new AIMessage("SELECT * FROM users WHERE age > 18;"),
    // Example 3
    new HumanMessage("Count all products"),
    new AIMessage("SELECT COUNT(*) FROM products;"),
    // Now the real question
    new HumanMessage("Get the names of users who joined in 2024"),
  ];

  console.log("\nFew-shot examples provided:");
  console.log("  1. 'Get all users' → 'SELECT * FROM users;'");
  console.log("  2. 'Get users older than 18' → 'SELECT * FROM users WHERE age > 18;'");
  console.log("  3. 'Count all products' → 'SELECT COUNT(*) FROM products;'");

  console.log("\nNew query: 'Get the names of users who joined in 2024'");

  const response = await model.invoke(fewShotMessages);

  console.log(`\nModel learned the pattern:`);
  console.log(`  ${response.content}`);
}

async function demoMessageMetadata() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 5: Message Properties & Metadata");
  console.log("=".repeat(60));

  // Create messages with additional properties
  const humanMsg = new HumanMessage({
    content: "Tell me a very short joke",
    name: "Tiago", // Optional: name of the sender
  });

  const response = await model.invoke([humanMsg]);

  console.log("\nHumanMessage properties:");
  console.log(`  content: "${humanMsg.content}"`);
  console.log(`  name: "${humanMsg.name}"`);
  console.log(`  type: "${humanMsg._getType()}"`);

  console.log("\nAIMessage properties:");
  console.log(`  content: "${response.content}"`);
  console.log(`  type: "${response._getType()}"`);
  console.log(`  response_metadata:`);
  console.log(`    model: ${response.response_metadata?.model}`);
  console.log(`  usage_metadata:`);
  console.log(`    input_tokens: ${response.usage_metadata?.input_tokens}`);
  console.log(`    output_tokens: ${response.usage_metadata?.output_tokens}`);
  console.log(`    total_tokens: ${response.usage_metadata?.total_tokens}`);
}

async function demoMultimodalConcept() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 6: Multimodal Messages (Vision)");
  console.log("=".repeat(60));

  // Need a vision-capable model for image analysis
  const visionModel = new ChatOpenAI({
    modelName: "gpt-4o-mini", // Vision-capable model
    temperature: 0,
    maxTokens: 300,
  });

  // Real image URL - a cat from a public image service
  const imageUrl = "https://cataas.com/cat";

  console.log("\nAnalyzing image from URL:");
  console.log(`  Random cat image (cataas.com)`);

  // Create multimodal message with text + image
  const imageMessage = new HumanMessage({
    content: [
      { type: "text", text: "What is in this image? Describe it briefly in 2-3 sentences." },
      {
        type: "image_url",
        image_url: { url: imageUrl },
      },
    ],
  });

  console.log("\nSending to vision model (gpt-4o-mini)...");

  try {
    const response = await visionModel.invoke([imageMessage]);
    console.log(`\nModel's analysis:`);
    console.log(`  ${response.content}`);
    console.log(`\n  Tokens used: ${response.usage_metadata?.total_tokens}`);
  } catch (error: any) {
    console.log(`\n  Error: ${error.message}`);
  }
}

async function demoShorthandFormat() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 7: OpenAI Format Shorthand");
  console.log("=".repeat(60));

  // LangChain also accepts OpenAI-style message format
  // This is convenient when working with existing code

  const openAIStyleMessages = [
    { role: "system" as const, content: "You are a helpful assistant." },
    { role: "user" as const, content: "What is 2+2?" },
  ];

  console.log("\nOpenAI-style format:");
  console.log('  { role: "system", content: "..." }');
  console.log('  { role: "user", content: "..." }');

  // This works directly with invoke()
  const response = await model.invoke(openAIStyleMessages);

  console.log(`\nResponse: ${response.content}`);
  console.log("\n  (Both formats work interchangeably!)");
}

async function main() {
  console.log("\n📨 LangChain Messages Tutorial\n");

  await demoBasicMessages();
  await demoSystemMessage();
  await demoConversationHistory();
  await demoFewShotPrompting();
  await demoMessageMetadata();
  await demoMultimodalConcept();
  await demoShorthandFormat();

  console.log("\n" + "=".repeat(60));
  console.log("Summary: Message Types");
  console.log("=".repeat(60));
  console.log(`
  | Type          | Role        | Purpose                          |
  |---------------|-------------|----------------------------------|
  | SystemMessage | system      | Set model behavior/personality   |
  | HumanMessage  | user        | User input/questions             |
  | AIMessage     | assistant   | Model responses                  |
  | ToolMessage   | tool        | Tool execution results           |
  `);
  console.log("=".repeat(60));
}

main().catch(console.error);