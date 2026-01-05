/**
 * 03-multiple-tools.ts
 *
 * Multiple Tools in One Agent!
 *
 * Key concepts:
 * - Binding multiple tools to a model
 * - How the LLM decides which tool to use
 * - Parallel tool calls (multiple tools at once)
 * - Sequential tool calls (tool loop pattern)
 * - Using createAgent for automatic tool execution
 *
 * The LLM reads ALL tool descriptions and chooses the best one
 * based on the user's request. It can even call multiple tools
 * in parallel when the tasks are independent!
 *
 * Run: npx tsx src/02-tools/03-multiple-tools.ts
 */

import "dotenv/config";
import { z } from "zod";
import { tool, createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";

/**
 * Tool 1: Calculator
 * For math operations
 */
const calculator = tool(
  async ({ operation, a, b }) => {
    let result: number;
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) return "Error: Division by zero";
        result = a / b;
        break;
      default:
        return "Unknown operation";
    }
    return `${a} ${operation} ${b} = ${result}`;
  },
  {
    name: "calculator",
    description:
      "Perform basic math operations (add, subtract, multiply, divide). Use this for any mathematical calculations.",
    schema: z.object({
      operation: z
        .enum(["add", "subtract", "multiply", "divide"])
        .describe("The math operation to perform"),
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    }),
  }
);

/**
 * Tool 2: Weather
 * For weather information (simulated)
 */
const getWeather = tool(
  async ({ city, unit }) => {
    // Simulated weather data
    const weatherData: Record<string, { temp: number; condition: string }> = {
      "new york": { temp: 22, condition: "Sunny" },
      london: { temp: 15, condition: "Cloudy" },
      tokyo: { temp: 28, condition: "Humid" },
      paris: { temp: 18, condition: "Partly cloudy" },
      sydney: { temp: 25, condition: "Clear" },
    };

    const data = weatherData[city.toLowerCase()];
    if (!data) {
      return `Weather data not available for ${city}`;
    }

    const temp = unit === "fahrenheit" ? (data.temp * 9) / 5 + 32 : data.temp;
    const unitSymbol = unit === "fahrenheit" ? "°F" : "°C";

    return `Weather in ${city}: ${temp}${unitSymbol}, ${data.condition}`;
  },
  {
    name: "get_weather",
    description:
      "Get current weather for a city. Use this when asked about weather, temperature, or climate conditions.",
    schema: z.object({
      city: z.string().describe("City name (e.g., 'New York', 'London')"),
      unit: z
        .enum(["celsius", "fahrenheit"])
        .default("celsius")
        .describe("Temperature unit"),
    }),
  }
);

/**
 * Tool 3: Unit Converter
 * For converting between units
 */
const convertUnits = tool(
  async ({ value, from, to }) => {
    const conversions: Record<string, Record<string, (v: number) => number>> = {
      km: {
        miles: (v) => v * 0.621371,
        meters: (v) => v * 1000,
      },
      miles: {
        km: (v) => v * 1.60934,
        meters: (v) => v * 1609.34,
      },
      kg: {
        pounds: (v) => v * 2.20462,
        grams: (v) => v * 1000,
      },
      pounds: {
        kg: (v) => v * 0.453592,
        grams: (v) => v * 453.592,
      },
      celsius: {
        fahrenheit: (v) => (v * 9) / 5 + 32,
        kelvin: (v) => v + 273.15,
      },
      fahrenheit: {
        celsius: (v) => ((v - 32) * 5) / 9,
        kelvin: (v) => ((v - 32) * 5) / 9 + 273.15,
      },
    };

    const converter = conversions[from.toLowerCase()]?.[to.toLowerCase()];
    if (!converter) {
      return `Cannot convert from ${from} to ${to}`;
    }

    const result = converter(value);
    return `${value} ${from} = ${result.toFixed(2)} ${to}`;
  },
  {
    name: "convert_units",
    description:
      "Convert between units (km/miles, kg/pounds, celsius/fahrenheit). Use this for unit conversions.",
    schema: z.object({
      value: z.number().describe("The value to convert"),
      from: z.string().describe("Source unit (km, miles, kg, pounds, celsius, fahrenheit)"),
      to: z.string().describe("Target unit"),
    }),
  }
);

/**
 * Tool 4: Date/Time
 * For date and time operations
 */
const getDateTime = tool(
  async ({ timezone, format }) => {
    const now = new Date();

    // Simple timezone offset simulation
    const offsets: Record<string, number> = {
      UTC: 0,
      EST: -5,
      PST: -8,
      GMT: 0,
      JST: 9,
      BRT: -3,
    };

    const offset = offsets[timezone.toUpperCase()] ?? 0;
    const localTime = new Date(now.getTime() + offset * 60 * 60 * 1000);

    if (format === "date") {
      return `Date in ${timezone}: ${localTime.toISOString().split("T")[0]}`;
    } else if (format === "time") {
      return `Time in ${timezone}: ${localTime.toISOString().split("T")[1].split(".")[0]}`;
    } else {
      return `DateTime in ${timezone}: ${localTime.toISOString()}`;
    }
  },
  {
    name: "get_datetime",
    description:
      "Get current date and/or time in a specific timezone. Use this for date/time queries.",
    schema: z.object({
      timezone: z
        .string()
        .default("UTC")
        .describe("Timezone (UTC, EST, PST, GMT, JST, BRT)"),
      format: z
        .enum(["date", "time", "datetime"])
        .default("datetime")
        .describe("What to return: date only, time only, or both"),
    }),
  }
);

// All tools in an array
const allTools = [calculator, getWeather, convertUnits, getDateTime];

const model = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
});

/**
 * Helper function to execute tool calls and return results
 */
async function executeToolCalls(
  toolCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }>
): Promise<ToolMessage[]> {
  const results: ToolMessage[] = [];

  for (const call of toolCalls) {
    const toolCallId = call.id ?? `call_${Date.now()}`;

    // Execute based on tool name
    let result: unknown;

    switch (call.name) {
      case "calculator":
        result = await calculator.invoke(call.args as Parameters<typeof calculator.invoke>[0]);
        break;
      case "get_weather":
        result = await getWeather.invoke(call.args as Parameters<typeof getWeather.invoke>[0]);
        break;
      case "convert_units":
        result = await convertUnits.invoke(call.args as Parameters<typeof convertUnits.invoke>[0]);
        break;
      case "get_datetime":
        result = await getDateTime.invoke(call.args as Parameters<typeof getDateTime.invoke>[0]);
        break;
      default:
        result = `Unknown tool: ${call.name}`;
    }

    // Extract content - result can be string or ToolMessage
    const resultContent =
      typeof result === "string"
        ? result
        : (result as { content: string }).content ?? String(result);

    results.push(
      new ToolMessage({
        content: resultContent,
        tool_call_id: toolCallId,
        name: call.name,
      })
    );
  }

  return results;
}

async function demoToolSelection() {
  console.log("=".repeat(60));
  console.log("DEMO 1: LLM Chooses the Right Tool");
  console.log("=".repeat(60));

  const modelWithTools = model.bindTools(allTools);

  // Test different queries - each should trigger a different tool
  const queries = [
    "What is 15 multiplied by 7?",
    "What's the weather in Tokyo?",
    "Convert 100 kilometers to miles",
    "What time is it in New York (EST)?",
  ];

  for (const query of queries) {
    console.log(`\nUser: "${query}"`);

    const response = await modelWithTools.invoke([new HumanMessage(query)]);

    if (response.tool_calls?.length) {
      const call = response.tool_calls[0];
      console.log(`  → LLM chose: ${call.name}`);
      console.log(`  → Args: ${JSON.stringify(call.args)}`);

      // Execute the tool
      const [result] = await executeToolCalls([call]);
      console.log(`  → Result: ${result.content}`);
    }
  }
}

async function demoParallelToolCalls() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 2: Parallel Tool Calls");
  console.log("=".repeat(60));

  const modelWithTools = model.bindTools(allTools);

  // This query requires multiple independent pieces of information
  const query =
    "What's the weather in London and Paris? Also, what is 25 + 17?";

  console.log(`\nUser: "${query}"`);
  console.log("\nThe LLM can call multiple tools in parallel:\n");

  const response = await modelWithTools.invoke([new HumanMessage(query)]);

  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log(`Found ${response.tool_calls.length} parallel tool calls:\n`);

    for (let i = 0; i < response.tool_calls.length; i++) {
      const call = response.tool_calls[i];
      console.log(`  ${i + 1}. ${call.name}(${JSON.stringify(call.args)})`);
    }

    // Execute all tools
    console.log("\nExecuting all tools...\n");
    const results = await executeToolCalls(response.tool_calls);

    for (const result of results) {
      console.log(`  → [${result.name}]: ${result.content}`);
    }
  }
}

async function demoToolLoop() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 3: Tool Loop (Manual Orchestration)");
  console.log("=".repeat(60));

  /**
   * This is the fundamental pattern for agents:
   * 1. Send user message to LLM with tools
   * 2. If LLM returns tool calls, execute them
   * 3. Send tool results back to LLM
   * 4. Repeat until LLM gives final answer
   */

  const modelWithTools = model.bindTools(allTools);

  // Complex query that might need multiple steps
  const query =
    "What's the temperature in Tokyo in Fahrenheit? And how much is that in Celsius?";

  console.log(`\nUser: "${query}"`);
  console.log("\nStarting tool loop...\n");

  // Conversation history
  const messages: BaseMessage[] = [new HumanMessage(query)];

  let iteration = 0;
  const maxIterations = 5;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`--- Iteration ${iteration} ---`);

    // Call the model
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    // Check if model wants to call tools
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log(`LLM requested ${response.tool_calls.length} tool(s):`);

      for (const call of response.tool_calls) {
        console.log(`  → ${call.name}(${JSON.stringify(call.args)})`);
      }

      // Execute tools and add results to messages
      const toolResults = await executeToolCalls(response.tool_calls);

      for (const result of toolResults) {
        messages.push(result);
        console.log(`  ← [${result.name}]: ${result.content}`);
      }

      console.log("");
    } else {
      // No tool calls = final answer
      console.log(`\nFinal Answer: ${response.content}`);
      break;
    }
  }
}

async function demoCreateAgent() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 4: Using createAgent (Automatic Tool Loop)");
  console.log("=".repeat(60));

  /**
   * createAgent handles the tool loop automatically!
   * It's the simplest way to create an agent with tools.
   */

  const agent = createAgent({
    model: "gpt-4.1-mini",
    tools: allTools,
    systemPrompt:
      "You are a helpful assistant with access to calculator, weather, unit conversion, and datetime tools. Always use tools when needed to provide accurate information.",
  });

  const queries = [
    "What's 123 times 456?",
    "What's the weather in Sydney and convert the temperature to Fahrenheit?",
  ];

  for (const query of queries) {
    console.log(`\nUser: "${query}"\n`);

    const result = await agent.invoke({
      messages: [new HumanMessage(query)],
    });

    // Show the agent's reasoning process
    let toolCallCount = 0;
    for (const msg of result.messages) {
      if (msg instanceof AIMessage && msg.tool_calls?.length) {
        for (const call of msg.tool_calls) {
          toolCallCount++;
          console.log(`  [Tool Call ${toolCallCount}] ${call.name}`);
        }
      } else if (msg instanceof ToolMessage) {
        console.log(`  [Tool Result] ${msg.content}`);
      } else if (msg instanceof AIMessage && msg.content) {
        console.log(`\nAgent: ${msg.content}`);
      }
    }
  }
}

async function demoToolDescriptionsMatter() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 5: Why Tool Descriptions Matter");
  console.log("=".repeat(60));

  /**
   * The LLM uses tool descriptions to decide which tool to use.
   * Good descriptions = correct tool selection
   * Bad descriptions = wrong tool or confusion
   */

  console.log("\nOur tools have these descriptions:");
  console.log("-".repeat(50));

  for (const toolDef of allTools) {
    console.log(`\n  ${toolDef.name}:`);
    console.log(`  "${toolDef.description}"`);
  }

  console.log("\n" + "-".repeat(50));
  console.log("\nAmbiguous query test:");

  const modelWithTools = model.bindTools(allTools);

  // Slightly ambiguous queries
  const ambiguousQueries = [
    "What's 32 degrees in Celsius?", // Could be calculator or converter
    "How hot is it in Paris?", // Weather
    "Give me the current date", // DateTime
  ];

  for (const query of ambiguousQueries) {
    console.log(`\n  Query: "${query}"`);

    const response = await modelWithTools.invoke([new HumanMessage(query)]);

    if (response.tool_calls?.length) {
      console.log(`  → Selected: ${response.tool_calls[0].name}`);
    } else {
      console.log(`  → No tool selected (answered directly)`);
    }
  }
}

async function main() {
  console.log("\n Multiple Tools Demo\n");

  await demoToolSelection();
  await demoParallelToolCalls();
  await demoToolLoop();
  await demoCreateAgent();
  await demoToolDescriptionsMatter();

  console.log("\n" + "=".repeat(60));
  console.log("Summary: Multiple Tools");
  console.log("=".repeat(60));
  console.log(`
  | Concept              | Description                              |
  |----------------------|------------------------------------------|
  | bindTools([...])     | Attach multiple tools to a model         |
  | Tool Selection       | LLM reads descriptions and picks best    |
  | Parallel Calls       | LLM can call multiple tools at once      |
  | Tool Loop            | Execute → Return → Repeat until done     |
  | createAgent          | Automatic tool loop handling             |
  `);

  console.log("Key takeaways:");
  console.log("  1. Tool descriptions guide LLM's choice - be specific!");
  console.log("  2. LLMs can call multiple tools in parallel");
  console.log("  3. The tool loop pattern is fundamental to agents");
  console.log("  4. createAgent simplifies the tool loop for you");
  console.log("=".repeat(60));
}

main().catch(console.error);
