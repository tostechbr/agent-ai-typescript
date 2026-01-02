/**
 * 01-agents.ts
 *
 * Introduction to AI Agents with LangChain!
 *
 * What is an Agent?
 * Agent = LLM + Tools + Loop
 *
 * The agent receives a question, decides if it needs a tool,
 * calls the tool, observes the result, and answers.
 *
 * Run: npx tsx src/02-tools/01-agents.ts
 */

import "dotenv/config";
import { z } from "zod";
import { createAgent, tool, AIMessage, ToolMessage } from "langchain";

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

// Create the agent with just one tool
const agent = createAgent({
  model: "openai:gpt-4o-mini",
  tools: [getBitcoinPrice],
  systemPrompt:
    "You are a helpful assistant. When asked about Bitcoin price, use the get_bitcoin_price tool.",
});

async function main() {
  console.log("Simple Agent Demo\n");

  // Ask about Bitcoin price - agent will use the tool
  console.log("User: What is the current Bitcoin price?\n");

  const result = await agent.invoke({
    messages: [{ role: "user", content: "What is the current Bitcoin price?" }],
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
