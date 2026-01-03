/**
 * 05-create-agent.ts
 *
 * Creating Agents with createAgent (LangChain v1 API)
 *
 * What is an Agent?
 * Agent = LLM + Tools + Loop (ReAct pattern)
 *
 * The agent receives a question, decides if it needs a tool,
 * calls the tool, observes the result, and answers.
 *
 * This is the HIGH-LEVEL API - great for getting started quickly.
 * For more control, use LangGraph directly (Module 3+).
 *
 * Run: npx tsx src/02-tools/05-create-agent.ts
 */

import "dotenv/config";
import { z } from "zod";
import { tool, createAgent } from "langchain";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

/**
 * A REAL tool that fetches Bitcoin price from CoinGecko API
 */
const getBitcoinPrice = tool(
  async () => {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl,eur"
    );
    const data = await response.json();

    return JSON.stringify({
      usd: data.bitcoin.usd,
      brl: data.bitcoin.brl,
      eur: data.bitcoin.eur,
    });
  },
  {
    name: "get_bitcoin_price",
    description: "Get the current Bitcoin price in USD, BRL, and EUR",
    schema: z.object({}),
  }
);

// Create the agent with the new LangChain v1 API
const agent = createAgent({
  model: "gpt-4.1-mini",
  tools: [getBitcoinPrice],
  systemPrompt: "You are a helpful assistant that provides cryptocurrency information.",
});

async function main() {
  console.log("Simple Agent Demo\n");

  // Ask about Bitcoin price - agent will use the tool
  console.log("User: What is the current Bitcoin price?\n");

  const result = await agent.invoke({
    messages: [new HumanMessage("What is the current Bitcoin price?")],
  });

  // Show the ReAct loop
  for (const msg of result.messages) {
    if (msg instanceof AIMessage && msg.tool_calls?.length) {
      // Agent decided to call a tool
      console.log("Agent: I need to check the current price...");
      console.log(`       → Calling: ${msg.tool_calls[0].name}()\n`);
    } else if (msg instanceof ToolMessage) {
      // Tool returned a result
      console.log(`Tool result: ${msg.content}\n`);
    } else if (msg instanceof AIMessage && msg.content) {
      // Agent's final response
      console.log(`Agent: ${msg.content}`);
    }
  }
}

main().catch(console.error);
