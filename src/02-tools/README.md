# Module 2: Tools & Agents

> Teaching LLMs to interact with the world through tools.

This module covers how to extend LLM capabilities by giving them access to external functions (tools). Each file builds on the previous, culminating in a fully autonomous agent.

---

## Overview

| File | Topic | Key Concept |
|------|-------|-------------|
| [01-simple-tool.ts](#01-simple-toolts) | First Tool | `tool()`, `bindTools()` |
| [02-tool-with-schema.ts](#02-tool-with-schemats) | Zod Validation | `.describe()`, `.optional()`, `.default()` |
| [03-multiple-tools.ts](#03-multiple-toolsts) | Multiple Tools | Tool selection, parallel calls, tool loop |
| [04-dynamic-tools.ts](#04-dynamic-toolsts) | Dynamic Tools | `DynamicTool`, factories, context-aware tools |
| [05-create-agent.ts](#05-create-agentts) | Agents | `createAgent()`, ReAct pattern |

---

## Files in Detail

### 01-simple-tool.ts

**Topic:** Creating and using your first tool.

```bash
npx tsx src/02-tools/01-simple-tool.ts
```

**What I learned:**
- A tool is a function the LLM can choose to call
- Tools have 3 parts: `name`, `description`, and `schema`
- `bindTools([...])` connects tools to a model
- The LLM returns `tool_calls` when it wants to use a tool
- You must execute the tool manually (or use an agent)

**Key takeaway:** The `description` is crucial - it tells the LLM *when* to use the tool. Write clear, specific descriptions.

---

### 02-tool-with-schema.ts

**Topic:** Advanced Zod validation for tool parameters.

```bash
npx tsx src/02-tools/02-tool-with-schema.ts
```

**Zod methods for tools:**

| Method | Purpose | Example |
|--------|---------|---------|
| `.describe("...")` | Explains field to LLM | `z.string().describe("User email")` |
| `.optional()` | Field can be omitted | `z.string().optional()` |
| `.default(val)` | Default if not provided | `z.number().default(10)` |
| `.min()/.max()` | Value/size limits | `z.number().min(0).max(100)` |
| `.enum([...])` | Allowed values | `z.enum(["a", "b", "c"])` |
| `.array(schema)` | List of items | `z.array(z.string())` |
| `.refine(fn)` | Custom validation | `schema.refine(d => d.a !== d.b)` |

**What I learned:**
- `.describe()` is CRITICAL - it's what the LLM reads to understand each field
- Nested objects work great for complex data structures
- Validation happens BEFORE the function executes
- `.refine()` enables custom business logic validation

**Key takeaway:** Good schemas = reliable tool calls. Always use `.describe()` on every field.

---

### 03-multiple-tools.ts

**Topic:** Working with multiple tools in one agent.

```bash
npx tsx src/02-tools/03-multiple-tools.ts
```

**Tool patterns:**

| Pattern | Description |
|---------|-------------|
| Tool Selection | LLM reads all descriptions and picks the best tool |
| Parallel Calls | LLM can call multiple tools at once for independent tasks |
| Tool Loop | Execute → Return → Repeat until LLM gives final answer |
| `createAgent` | Automatic tool loop handling |

**What I learned:**
- The LLM uses tool descriptions to decide which tool to use
- Models can call multiple tools in parallel when tasks are independent
- The tool loop pattern is fundamental: `User → LLM → Tools → LLM → Answer`
- `createAgent()` handles the loop automatically

**Tool loop visualization:**
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│   LLM   │────▶│  Tools  │
└─────────┘     └────┬────┘     └────┬────┘
                     │               │
                     │◀──────────────┘
                     │
                     ▼
               ┌─────────┐
               │ Answer  │
               └─────────┘
```

**Key takeaway:** Write distinct, specific tool descriptions. Ambiguous descriptions confuse the LLM.

---

### 04-dynamic-tools.ts

**Topic:** Creating tools at runtime.

```bash
npx tsx src/02-tools/04-dynamic-tools.ts
```

**Dynamic tool patterns:**

| Pattern | Use Case |
|---------|----------|
| `DynamicTool` | Quick tools with string input |
| `DynamicStructuredTool` | Dynamic tools with Zod schemas |
| Tool Factory | Generate tools from database/config |
| Context-Aware Tools | Different tools per user/permission |
| API Spec Tools | Auto-generate from API definitions |

**What I learned:**
- `DynamicTool` from `@langchain/core/tools` for simple runtime tools
- `DynamicStructuredTool` for dynamic tools with schemas
- Factory functions can generate tools from data (e.g., one tool per database record)
- Context-aware tools enable permission-based access (admin vs user vs guest)
- API specifications can be transformed into tools automatically

**Example - Tool Factory:**
```typescript
// Generate tools from database
const companyTools = companies.map(company =>
  tool(
    async () => fetchCompanyData(company.id),
    {
      name: `get_${company.id}_info`,
      description: `Get info about ${company.name}`,
      schema: z.object({})
    }
  )
);
```

**Key takeaway:** Tools don't have to be static. Generate them from data, APIs, or user context for powerful dynamic agents.

---

### 05-create-agent.ts

**Topic:** Building autonomous agents with `createAgent()`.

```bash
npx tsx src/02-tools/05-create-agent.ts
```

**What I learned:**
- `createAgent()` creates a production-ready ReAct agent
- It handles the tool loop automatically (no manual orchestration needed)
- Agents can make multiple tool calls to answer complex questions
- The ReAct pattern: Reason → Act → Observe → Repeat

**Agent vs Model with Tools:**

| Approach | Tool Execution | Loop Handling | Use Case |
|----------|----------------|---------------|----------|
| `model.bindTools()` | Manual | Manual | Fine-grained control |
| `createAgent()` | Automatic | Automatic | Production agents |

**Key takeaway:** Use `createAgent()` for most agent use cases. It handles the complexity of tool orchestration for you.

---

## Running the Examples

Each file is self-contained and can be run independently:

```bash
# Run any example
npx tsx src/02-tools/<filename>.ts

# Run all in sequence
for f in src/02-tools/*.ts; do npx tsx "$f"; done
```

## Prerequisites

- Node.js 18+
- `OPENAI_API_KEY` configured in `.env` (most examples use GPT-4)
- Dependencies: `langchain`, `@langchain/openai`, `@langchain/core`, `zod`

---

## Summary

After completing this module, I understand:

1. **What tools are** - Functions the LLM can call to interact with the world
2. **How to create tools** - Using `tool()` with Zod schemas for validation
3. **How tools are selected** - LLM reads descriptions and picks the best match
4. **Tool orchestration** - The loop pattern and parallel execution
5. **Dynamic tools** - Creating tools at runtime from data or context
6. **Agents** - `createAgent()` for autonomous tool-using systems

**Key imports:**
```typescript
import { tool, createAgent } from "langchain";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
```

**Next:** [Module 3 - LangGraph Basics](../03-langgraph-basics/) - Building stateful agent workflows with graphs.
