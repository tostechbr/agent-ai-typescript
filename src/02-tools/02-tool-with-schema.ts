/**
 * 02-tool-with-schema.ts
 *
 * Tools with Advanced Zod Validation!
 *
 * Why are schemas important?
 * 1. The LLM reads the schema to understand HOW to use the tool
 * 2. Validation happens BEFORE the function executes
 * 3. You get TypeScript types automatically
 * 4. Input errors are caught early
 *
 * Concepts covered:
 * - .describe() → Explains each field to the LLM
 * - .min()/.max() → Range validation
 * - .enum() → Allowed values
 * - .optional() → Optional fields
 * - .default() → Default values
 * - .array() → Lists of values
 * - Nested objects
 *
 * Run: npx tsx src/02-tools/02-tool-with-schema.ts
 */

import "dotenv/config";
import { z } from "zod";
import { tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

/**
 * The .describe() function is CRITICAL!
 * It explains to the LLM what each parameter means.
 *
 * Without describe: The LLM "guesses" based on the field name
 * With describe: The LLM understands exactly what you want
 */
const searchProducts = tool(
  async ({ query, category, maxPrice }) => {
    // Simulating a database search
    return JSON.stringify({
      query,
      category,
      maxPrice,
      results: [
        { name: `${category} Premium`, price: maxPrice * 0.8 },
        { name: `${category} Basic`, price: maxPrice * 0.5 },
      ],
    });
  },
  {
    name: "search_products",
    description: "Search for products in the store catalog",
    schema: z.object({
      // Each .describe() helps the LLM understand the field
      query: z.string().describe("Search keywords (e.g., 'wireless headphones')"),
      category: z
        .enum(["electronics", "clothing", "books", "home"])
        .describe("Product category to filter by"),
      maxPrice: z
        .number()
        .min(0)
        .max(10000)
        .describe("Maximum price in USD"),
    }),
  }
);

/**
 * Not all fields need to be required!
 *
 * .optional() → Field can be undefined
 * .default(value) → Uses this value if not provided
 *
 * Tip: Use .default() when there's a sensible default value
 *      Use .optional() when the absence of the value is meaningful
 */
const searchOrders = tool(
  async ({ userId, status, limit, includeArchived }) => {
    return JSON.stringify({
      userId,
      status: status ?? "all",
      limit,
      includeArchived,
      message: `Found orders for user ${userId}`,
    });
  },
  {
    name: "search_orders",
    description: "Search for user orders with optional filters",
    schema: z.object({
      userId: z.string().describe("Unique identifier for the user"),

      // Optional: can be undefined
      status: z
        .enum(["pending", "shipped", "delivered", "cancelled"])
        .optional()
        .describe("Filter by order status (omit for all statuses)"),

      // Default: will always have a value
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(10)
        .describe("Maximum number of results to return"),

      // Default with boolean
      includeArchived: z
        .boolean()
        .default(false)
        .describe("Whether to include archived orders"),
    }),
  }
);

/**
 * Arrays allow the LLM to pass multiple values!
 *
 * z.array(z.string()) → Array of strings
 * z.array(z.number()).min(1).max(10) → Array with 1-10 numbers
 */
const sendNotification = tool(
  async ({ recipients, message, channels, priority }) => {
    return JSON.stringify({
      sent: true,
      recipients: recipients.length,
      channels,
      priority,
      preview: message.substring(0, 50) + "...",
    });
  },
  {
    name: "send_notification",
    description: "Send a notification to multiple users across different channels",
    schema: z.object({
      // Array of strings with size validation
      recipients: z
        .array(z.string())
        .min(1)
        .max(100)
        .describe("List of user IDs to notify"),

      message: z
        .string()
        .min(1)
        .max(500)
        .describe("Notification message content"),

      // Array of enums - multiple channels allowed
      channels: z
        .array(z.enum(["email", "sms", "push", "slack"]))
        .min(1)
        .describe("Channels to send notification through"),

      priority: z
        .enum(["low", "normal", "high", "urgent"])
        .default("normal")
        .describe("Notification priority level"),
    }),
  }
);

/**
 * For complex data, use nested objects!
 *
 * This allows you to structure related information
 * and makes it easier for the LLM to fill correctly.
 */
const createEvent = tool(
  async ({ title, dateTime, location, attendees }) => {
    return JSON.stringify({
      created: true,
      event: {
        title,
        date: dateTime.date,
        time: dateTime.time,
        timezone: dateTime.timezone,
        venue: location.venue,
        address: location.address,
        virtual: location.isVirtual,
        attendeeCount: attendees.length,
      },
    });
  },
  {
    name: "create_event",
    description: "Create a calendar event with location and attendees",
    schema: z.object({
      title: z.string().describe("Event title"),

      // Nested object for date/time
      dateTime: z
        .object({
          date: z.string().describe("Date in YYYY-MM-DD format"),
          time: z.string().describe("Time in HH:MM format (24h)"),
          timezone: z
            .string()
            .default("UTC")
            .describe("Timezone (e.g., 'America/Sao_Paulo')"),
        })
        .describe("When the event occurs"),

      // Nested object for location
      location: z
        .object({
          venue: z.string().describe("Venue or meeting room name"),
          address: z.string().optional().describe("Physical address if applicable"),
          isVirtual: z.boolean().default(false).describe("Is this a virtual event?"),
        })
        .describe("Where the event takes place"),

      // Array of objects for attendees
      attendees: z
        .array(
          z.object({
            email: z.string().describe("Attendee email address"),
            role: z
              .enum(["organizer", "required", "optional"])
              .default("required")
              .describe("Attendee role"),
          })
        )
        .min(1)
        .describe("List of people to invite"),
    }),
  }
);

/**
 * Zod allows custom validations with .refine()
 * This is useful for specific business rules.
 */
const transferMoney = tool(
  async ({ fromAccount, toAccount, amount, currency, description }) => {
    return JSON.stringify({
      success: true,
      transaction: {
        from: fromAccount,
        to: toAccount,
        amount: `${currency} ${amount.toFixed(2)}`,
        description,
        timestamp: new Date().toISOString(),
      },
    });
  },
  {
    name: "transfer_money",
    description: "Transfer money between accounts (requires approval for large amounts)",
    schema: z
      .object({
        fromAccount: z
          .string()
          .regex(/^[A-Z]{2}\d{10}$/)
          .describe("Source account (format: XX0000000000)"),

        toAccount: z
          .string()
          .regex(/^[A-Z]{2}\d{10}$/)
          .describe("Destination account (format: XX0000000000)"),

        amount: z
          .number()
          .positive()
          .max(1000000)
          .describe("Amount to transfer"),

        currency: z
          .enum(["USD", "EUR", "BRL", "GBP"])
          .default("USD")
          .describe("Currency for the transfer"),

        description: z
          .string()
          .max(200)
          .optional()
          .describe("Optional transfer description"),
      })
      // Custom validation: accounts cannot be the same
      .refine((data) => data.fromAccount !== data.toAccount, {
        message: "Source and destination accounts must be different",
      }),
  }
);

const model = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
});

async function demoBasicSchema() {
  console.log("=".repeat(60));
  console.log("DEMO 1: Basic Schema with .describe()");
  console.log("=".repeat(60));

  const modelWithTool = model.bindTools([searchProducts]);

  console.log("\nUser: Find me electronics under $500\n");

  const response = await modelWithTool.invoke([
    new HumanMessage("Find me electronics under $500"),
  ]);

  if (response.tool_calls?.length) {
    const call = response.tool_calls[0];
    console.log("LLM understood and filled:");
    console.log(`  Tool: ${call.name}`);
    console.log(`  Args: ${JSON.stringify(call.args, null, 2)}`);

    // Execute the tool - we pass the complete ToolCall
    const result = await searchProducts.invoke(call);
    console.log(`\nResult: ${result}`);
  }
}

async function demoOptionals() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 2: Optional Fields and Defaults");
  console.log("=".repeat(60));

  const modelWithTool = model.bindTools([searchOrders]);

  // Test 1: Only required fields
  console.log("\nUser: Show orders for user U123\n");

  const response1 = await modelWithTool.invoke([
    new HumanMessage("Show orders for user U123"),
  ]);

  if (response1.tool_calls?.length) {
    const call = response1.tool_calls[0];
    console.log("Call 1 (minimum):");
    console.log(`  Args: ${JSON.stringify(call.args)}`);
    console.log("  → limit will use default (10)");
    console.log("  → includeArchived will use default (false)");
  }

  // Test 2: With optional fields
  console.log("\nUser: Show last 5 pending orders for user U456\n");

  const response2 = await modelWithTool.invoke([
    new HumanMessage("Show last 5 pending orders for user U456"),
  ]);

  if (response2.tool_calls?.length) {
    const call = response2.tool_calls[0];
    console.log("Call 2 (with optionals):");
    console.log(`  Args: ${JSON.stringify(call.args)}`);
  }
}

async function demoArrays() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 3: Arrays and Multiple Values");
  console.log("=".repeat(60));

  const modelWithTool = model.bindTools([sendNotification]);

  console.log("\nUser: Send urgent notification to users A, B, C via email and slack\n");

  const response = await modelWithTool.invoke([
    new HumanMessage(
      "Send an urgent notification saying 'System maintenance in 1 hour' to users user_a, user_b, user_c via email and slack"
    ),
  ]);

  if (response.tool_calls?.length) {
    const call = response.tool_calls[0];
    console.log("LLM filled arrays correctly:");
    console.log(`  recipients: ${JSON.stringify(call.args.recipients)}`);
    console.log(`  channels: ${JSON.stringify(call.args.channels)}`);
    console.log(`  priority: ${call.args.priority}`);

    const result = await sendNotification.invoke(call);
    console.log(`\nResult: ${result}`);
  }
}

async function demoNestedObjects() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 4: Nested Objects");
  console.log("=".repeat(60));

  const modelWithTool = model.bindTools([createEvent]);

  console.log("\nUser: Create a team meeting tomorrow at 2pm in Conference Room A\n");

  const response = await modelWithTool.invoke([
    new HumanMessage(
      "Create a team meeting called 'Sprint Planning' for 2025-01-10 at 14:00 " +
        "in Conference Room A. Invite alice@company.com as organizer and bob@company.com as required."
    ),
  ]);

  if (response.tool_calls?.length) {
    const call = response.tool_calls[0];
    console.log("LLM structured nested objects:");
    console.log(JSON.stringify(call.args, null, 2));

    const result = await createEvent.invoke(call);
    console.log(`\nResult: ${result}`);
  }
}

async function demoValidation() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 5: Schema Validation");
  console.log("=".repeat(60));

  // Let's test validation directly (without LLM)
  console.log("\nTesting Zod validation directly:\n");

  // Valid test
  try {
    const validArgs = {
      fromAccount: "BR1234567890",
      toAccount: "US0987654321",
      amount: 100,
      currency: "USD" as const,
    };
    const result = await transferMoney.invoke(validArgs);
    console.log("Valid transfer:");
    console.log(`  ${result}`);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
  }

  // Invalid test: same account
  console.log("\nTesting source = destination account:");
  try {
    const invalidArgs = {
      fromAccount: "BR1234567890",
      toAccount: "BR1234567890", // Same account!
      amount: 100,
    };
    await transferMoney.invoke(invalidArgs);
  } catch (error: any) {
    console.log(`  Error caught: same accounts not allowed`);
  }

  // Invalid test: wrong format
  console.log("\nTesting invalid account format:");
  try {
    const badFormat = {
      fromAccount: "invalid",
      toAccount: "US0987654321",
      amount: 100,
    };
    await transferMoney.invoke(badFormat);
  } catch (error: any) {
    console.log(`  Error caught: invalid account format`);
  }
}

async function main() {
  console.log("\n Tools with Advanced Zod Schemas\n");

  await demoBasicSchema();
  await demoOptionals();
  await demoArrays();
  await demoNestedObjects();
  await demoValidation();

  console.log("\n" + "=".repeat(60));
  console.log("Summary: Zod Types for Tools");
  console.log("=".repeat(60));
  console.log(`
  | Zod Method              | Purpose                                |
  |-------------------------|----------------------------------------|
  | .describe("...")        | Explains the field to the LLM          |
  | .optional()             | Field can be omitted                   |
  | .default(value)         | Default value if not provided          |
  | .min(n) / .max(n)       | Numeric or size limits                 |
  | .enum([...])            | List of allowed values                 |
  | .array(schema)          | List of items of schema type           |
  | .regex(/pattern/)       | Regular expression validation          |
  | .refine(fn)             | Custom validation                      |
  `);

  console.log("Important tips:");
  console.log("  1. ALWAYS use .describe() - it's what the LLM reads!");
  console.log("  2. Use .default() for sensible defaults");
  console.log("  3. Use .enum() to limit options");
  console.log("  4. Validation happens BEFORE execution");
  console.log("=".repeat(60));
}

main().catch(console.error);
