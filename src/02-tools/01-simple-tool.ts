/**
 * 01-simple-tool.ts
 *
 * Your First Tool!
 *
 * What is a Tool?
 * A tool is a function that an LLM can choose to call.
 * The LLM sees the tool's name and description, then decides when to use it.
 *
 * Key concepts:
 * - name: How the LLM identifies the tool
 * - description: Tells the LLM WHEN and WHY to use this tool
 * - schema: Defines the parameters the tool accepts (using Zod)
 * - function: The actual code that runs when the tool is called
 *
 * Run: npx tsx src/02-tools/01-simple-tool.ts
 */

import "dotenv/config";
import { z } from "zod";
import { tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

/**
 * A simple greeting tool.
 * The LLM will call this when it needs to greet someone.
 */
const greet = tool(
  // The function that executes when the tool is called
  ({ name }) => {
    return `Hello, ${name}! Welcome to the world of AI agents!`;
  },
  {
    // Tool metadata - this is what the LLM sees
    name: "greet",
    description: "Greet a person by their name. Use this when someone asks to be greeted.",
    schema: z.object({
      name: z.string().describe("The name of the person to greet"),
    }),
  }
);

const model = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
});

// bindTools tells the model which tools are available
const modelWithTools = model.bindTools([greet]);

async function main() {
  console.log("=== Simple Tool Demo ===\n");

  // First, let's see what the tool looks like to the LLM
  console.log("Tool definition:");
  console.log(`  Name: ${greet.name}`);
  console.log(`  Description: ${greet.description}\n`);

  // Ask the model something that should trigger the tool
  console.log('User: "Please greet Maria"\n');

  const response = await modelWithTools.invoke("Please greet Maria");

  // Check if the model decided to call a tool
  if (response.tool_calls && response.tool_calls.length > 0) {
    const toolCall = response.tool_calls[0];
    console.log("Model decided to use a tool!");
    console.log(`  Tool: ${toolCall.name}`);
    console.log(`  Arguments: ${JSON.stringify(toolCall.args)}\n`);

    // Execute the tool manually (in an agent, this happens automatically)
    const toolResult = await greet.invoke(toolCall.args as { name: string });
    console.log(`Tool result: ${toolResult}`);
  } else {
    // Model responded directly without using a tool
    console.log(`Model response: ${response.content}`);
  }
}

main().catch(console.error);
