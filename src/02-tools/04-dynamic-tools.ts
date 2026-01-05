/**
 * 04-dynamic-tools.ts
 *
 * Dynamic Tools - Creating Tools at Runtime!
 *
 * Sometimes you don't know what tools you need until runtime.
 * Examples:
 * - Tools generated from database records
 * - Tools based on user permissions
 * - Tools that change based on context
 * - Tools created from API specifications
 *
 * Key concepts:
 * - DynamicTool: Create tools from functions at runtime
 * - DynamicStructuredTool: Dynamic tools with Zod schemas
 * - Tool factories: Functions that generate tools
 * - Context-aware tools: Tools that adapt to runtime data
 *
 * Run: npx tsx src/02-tools/04-dynamic-tools.ts
 */

import "dotenv/config";
import { z } from "zod";
import { tool, createAgent } from "langchain";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

/**
 * DynamicTool is useful when:
 * - You need to create tools from simple functions
 * - The input is just a string
 * - You want quick tool creation without Zod schemas
 */

function createSimpleDynamicTools() {
  // Create a tool that echoes input
  const echoTool = new DynamicTool({
    name: "echo",
    description: "Echoes back the input text. Use for testing.",
    func: async (input: string) => {
      return `Echo: ${input}`;
    },
  });

  // Create a tool that reverses text
  const reverseTool = new DynamicTool({
    name: "reverse_text",
    description: "Reverses the input text. Use when asked to reverse something.",
    func: async (input: string) => {
      return input.split("").reverse().join("");
    },
  });

  // Create a tool that counts characters
  const countTool = new DynamicTool({
    name: "count_characters",
    description: "Counts characters in the input text.",
    func: async (input: string) => {
      return `The text has ${input.length} characters.`;
    },
  });

  return [echoTool, reverseTool, countTool];
}

/**
 * DynamicStructuredTool is useful when:
 * - You need structured input with multiple parameters
 * - You want type validation at runtime
 * - The schema might be determined at runtime
 */

function createStructuredDynamicTools() {
  // A tool with dynamic schema
  const mathTool = new DynamicStructuredTool({
    name: "math_operation",
    description: "Performs a math operation on two numbers",
    schema: z.object({
      operation: z.enum(["add", "subtract", "multiply", "divide"]),
      x: z.number().describe("First number"),
      y: z.number().describe("Second number"),
    }),
    func: async ({ operation, x, y }) => {
      switch (operation) {
        case "add":
          return `${x} + ${y} = ${x + y}`;
        case "subtract":
          return `${x} - ${y} = ${x - y}`;
        case "multiply":
          return `${x} * ${y} = ${x * y}`;
        case "divide":
          return y !== 0 ? `${x} / ${y} = ${x / y}` : "Error: Division by zero";
        default:
          return "Unknown operation";
      }
    },
  });

  return [mathTool];
}

/**
 * Tool factories create tools dynamically from external data.
 * This is powerful for:
 * - Creating tools from database records
 * - Generating API-specific tools
 * - Building tools based on configuration
 */

// Simulated database of companies
interface Company {
  id: string;
  name: string;
  industry: string;
  employees: number;
  revenue: string;
  founded: number;
}

const companiesDatabase: Company[] = [
  {
    id: "apple",
    name: "Apple Inc.",
    industry: "Technology",
    employees: 164000,
    revenue: "$394.3B",
    founded: 1976,
  },
  {
    id: "google",
    name: "Google LLC",
    industry: "Technology",
    employees: 182000,
    revenue: "$307.4B",
    founded: 1998,
  },
  {
    id: "tesla",
    name: "Tesla Inc.",
    industry: "Automotive/Energy",
    employees: 140000,
    revenue: "$96.8B",
    founded: 2003,
  },
];

/**
 * Factory function that creates a tool for each company
 */
function createCompanyTools(companies: Company[]) {
  return companies.map((company) =>
    tool(
      async () => {
        return JSON.stringify({
          name: company.name,
          industry: company.industry,
          employees: company.employees.toLocaleString(),
          revenue: company.revenue,
          founded: company.founded,
          age: new Date().getFullYear() - company.founded,
        });
      },
      {
        name: `get_${company.id}_info`,
        description: `Get information about ${company.name}. Use this when asked about ${company.name} or ${company.id}.`,
        schema: z.object({}),
      }
    )
  );
}

/**
 * Tools that behave differently based on runtime context.
 * Useful for:
 * - User-specific tools
 * - Permission-based functionality
 * - Environment-specific behavior
 */

interface UserContext {
  userId: string;
  name: string;
  role: "admin" | "user" | "guest";
  permissions: string[];
}

function createUserContextTools(user: UserContext) {
  const tools = [];

  // Basic tool available to everyone
  tools.push(
    tool(
      async () => {
        return `Current user: ${user.name} (${user.role})`;
      },
      {
        name: "get_current_user",
        description: "Get information about the current logged-in user",
        schema: z.object({}),
      }
    )
  );

  // Tool only for users with "read_reports" permission
  if (user.permissions.includes("read_reports")) {
    tools.push(
      tool(
        async ({ reportType }) => {
          return `[${user.name}] Fetching ${reportType} report... Report data here.`;
        },
        {
          name: "get_report",
          description: "Fetch a business report. Requires read_reports permission.",
          schema: z.object({
            reportType: z
              .enum(["sales", "inventory", "users"])
              .describe("Type of report to fetch"),
          }),
        }
      )
    );
  }

  // Admin-only tool
  if (user.role === "admin") {
    tools.push(
      tool(
        async ({ targetUserId, action }) => {
          return `[ADMIN ${user.name}] Performed ${action} on user ${targetUserId}`;
        },
        {
          name: "admin_user_action",
          description: "Perform admin actions on users. Admin only.",
          schema: z.object({
            targetUserId: z.string().describe("User ID to perform action on"),
            action: z
              .enum(["suspend", "activate", "reset_password"])
              .describe("Action to perform"),
          }),
        }
      )
    );
  }

  return tools;
}

/**
 * Create tools from API specifications at runtime.
 * This pattern is useful for:
 * - REST API integrations
 * - GraphQL endpoints
 * - Dynamic service discovery
 */

interface ApiEndpoint {
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: "string" | "number";
    required: boolean;
    description: string;
  }>;
}

const apiSpec: ApiEndpoint[] = [
  {
    name: "list_products",
    method: "GET",
    path: "/api/products",
    description: "List all products with optional filtering",
    parameters: [
      {
        name: "category",
        type: "string",
        required: false,
        description: "Filter by category",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Max results to return",
      },
    ],
  },
  {
    name: "get_product",
    method: "GET",
    path: "/api/products/:id",
    description: "Get a specific product by ID",
    parameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Product ID",
      },
    ],
  },
  {
    name: "create_order",
    method: "POST",
    path: "/api/orders",
    description: "Create a new order",
    parameters: [
      {
        name: "productId",
        type: "string",
        required: true,
        description: "Product to order",
      },
      {
        name: "quantity",
        type: "number",
        required: true,
        description: "Quantity to order",
      },
    ],
  },
];

function createApiTools(endpoints: ApiEndpoint[]) {
  return endpoints.map((endpoint) => {
    // Build Zod schema dynamically from parameters
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    for (const param of endpoint.parameters) {
      let field: z.ZodTypeAny =
        param.type === "number" ? z.number() : z.string();

      field = field.describe(param.description);

      if (!param.required) {
        field = field.optional();
      }

      schemaFields[param.name] = field;
    }

    const schema = z.object(schemaFields);

    return new DynamicStructuredTool({
      name: endpoint.name,
      description: `${endpoint.description} [${endpoint.method} ${endpoint.path}]`,
      schema,
      func: async (params) => {
        // Simulate API call
        return JSON.stringify({
          endpoint: endpoint.path,
          method: endpoint.method,
          params,
          response: `Simulated ${endpoint.method} to ${endpoint.path}`,
          status: 200,
        });
      },
    });
  });
}

const model = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
});

async function demoDynamicTool() {
  console.log("=".repeat(60));
  console.log("DEMO 1: DynamicTool - Simple Dynamic Tools");
  console.log("=".repeat(60));

  const tools = createSimpleDynamicTools();

  console.log("\nCreated tools dynamically:");
  for (const t of tools) {
    console.log(`  - ${t.name}: ${t.description}`);
  }

  const modelWithTools = model.bindTools(tools);

  const queries = ["Reverse the word 'hello'", "How many characters in 'LangChain'?"];

  for (const query of queries) {
    console.log(`\nUser: "${query}"`);
    const response = await modelWithTools.invoke([new HumanMessage(query)]);

    if (response.tool_calls?.length) {
      const call = response.tool_calls[0];
      console.log(`  → Tool: ${call.name}`);
      console.log(`  → Input: ${JSON.stringify(call.args)}`);

      const selectedTool = tools.find((t) => t.name === call.name);
      if (selectedTool) {
        const result = await selectedTool.invoke(call.args.input as string);
        console.log(`  → Result: ${result}`);
      }
    }
  }
}

async function demoDynamicStructuredTool() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 2: DynamicStructuredTool - With Schemas");
  console.log("=".repeat(60));

  const tools = createStructuredDynamicTools();

  console.log("\nCreated structured dynamic tool:");
  console.log(`  - ${tools[0].name}: ${tools[0].description}`);

  const modelWithTools = model.bindTools(tools);

  const query = "What is 42 multiplied by 17?";
  console.log(`\nUser: "${query}"`);

  const response = await modelWithTools.invoke([new HumanMessage(query)]);

  if (response.tool_calls?.length) {
    const call = response.tool_calls[0];
    console.log(`  → Tool: ${call.name}`);
    console.log(`  → Args: ${JSON.stringify(call.args)}`);

    const result = await tools[0].invoke(
      call.args as { operation: "add" | "subtract" | "multiply" | "divide"; x: number; y: number }
    );
    console.log(`  → Result: ${result}`);
  }
}

async function demoToolFactory() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 3: Tool Factory - Tools from Database");
  console.log("=".repeat(60));

  // Generate tools from company database
  const companyTools = createCompanyTools(companiesDatabase);

  console.log(`\nGenerated ${companyTools.length} tools from database:`);
  for (const t of companyTools) {
    console.log(`  - ${t.name}`);
  }

  const modelWithTools = model.bindTools(companyTools);

  const queries = ["Tell me about Apple", "What's Tesla's revenue?"];

  for (const query of queries) {
    console.log(`\nUser: "${query}"`);
    const response = await modelWithTools.invoke([new HumanMessage(query)]);

    if (response.tool_calls?.length) {
      const call = response.tool_calls[0];
      console.log(`  → Tool: ${call.name}`);

      const selectedTool = companyTools.find((t) => t.name === call.name);
      if (selectedTool) {
        const result = await selectedTool.invoke(call);
        console.log(`  → Result: ${typeof result === "string" ? result : result.content}`);
      }
    }
  }
}

async function demoContextAwareTools() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 4: Context-Aware Tools");
  console.log("=".repeat(60));

  // Different users get different tools
  const adminUser: UserContext = {
    userId: "admin-001",
    name: "Alice Admin",
    role: "admin",
    permissions: ["read_reports", "write_reports", "manage_users"],
  };

  const regularUser: UserContext = {
    userId: "user-042",
    name: "Bob User",
    role: "user",
    permissions: ["read_reports"],
  };

  const guestUser: UserContext = {
    userId: "guest-999",
    name: "Guest",
    role: "guest",
    permissions: [],
  };

  console.log("\nTools available per user role:\n");

  for (const user of [adminUser, regularUser, guestUser]) {
    const userTools = createUserContextTools(user);
    console.log(`  ${user.role.toUpperCase()} (${user.name}):`);
    for (const t of userTools) {
      console.log(`    - ${t.name}`);
    }
  }

  // Demo with admin user
  console.log("\n--- Testing as Admin ---");
  const adminTools = createUserContextTools(adminUser);
  const adminModel = model.bindTools(adminTools);

  const adminQuery = "Suspend user ID user-123";
  console.log(`\nAdmin Query: "${adminQuery}"`);

  const response = await adminModel.invoke([new HumanMessage(adminQuery)]);

  if (response.tool_calls?.length) {
    const call = response.tool_calls[0];
    console.log(`  → Tool: ${call.name}`);
    console.log(`  → Args: ${JSON.stringify(call.args)}`);

    // Execute the matching tool (using any for dynamic tool invocation)
    const selectedTool = adminTools.find((t) => t.name === call.name);
    if (selectedTool) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (selectedTool as any).invoke(call.args);
      const content = typeof result === "string" ? result : result?.content ?? String(result);
      console.log(`  → Result: ${content}`);
    }
  }
}

async function demoApiTools() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 5: Dynamic API Tools from Specification");
  console.log("=".repeat(60));

  // Generate tools from API specification
  const apiTools = createApiTools(apiSpec);

  console.log(`\nGenerated ${apiTools.length} tools from API spec:`);
  for (const t of apiTools) {
    console.log(`  - ${t.name}: ${t.description.substring(0, 50)}...`);
  }

  const modelWithTools = model.bindTools(apiTools);

  const query = "Create an order for product ABC123, quantity 5";
  console.log(`\nUser: "${query}"`);

  const response = await modelWithTools.invoke([new HumanMessage(query)]);

  if (response.tool_calls?.length) {
    const call = response.tool_calls[0];
    console.log(`  → Tool: ${call.name}`);
    console.log(`  → Args: ${JSON.stringify(call.args)}`);

    const selectedTool = apiTools.find((t) => t.name === call.name);
    if (selectedTool) {
      const result = await selectedTool.invoke(call.args);
      console.log(`  → Result: ${result}`);
    }
  }
}

async function main() {
  console.log("\n Dynamic Tools Demo\n");

  await demoDynamicTool();
  await demoDynamicStructuredTool();
  await demoToolFactory();
  await demoContextAwareTools();
  await demoApiTools();

  console.log("\n" + "=".repeat(60));
  console.log("Summary: Dynamic Tools");
  console.log("=".repeat(60));
  console.log(`
  | Pattern                  | Use Case                              |
  |--------------------------|---------------------------------------|
  | DynamicTool              | Quick tools with string input         |
  | DynamicStructuredTool    | Dynamic tools with Zod schemas        |
  | Tool Factory             | Generate tools from data/config       |
  | Context-Aware Tools      | Different tools per user/context      |
  | API Spec Tools           | Auto-generate from API definitions    |
  `);

  console.log("Key takeaways:");
  console.log("  1. Tools can be created at runtime, not just at build time");
  console.log("  2. Use factories to generate tools from databases/configs");
  console.log("  3. Context-aware tools enable permission-based access");
  console.log("  4. API specs can be transformed into tools automatically");
  console.log("=".repeat(60));
}

main().catch(console.error);
