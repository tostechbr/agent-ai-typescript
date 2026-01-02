# Module 1: Fundamentals

> Learning the basics of LLM communication with LangChain in TypeScript.

This module covers the essential building blocks for working with Large Language Models. Each file explores a specific concept with practical examples.

---

## Overview

| File | Topic | Key Concept |
|------|-------|-------------|
| [01-hello-llm.ts](#01-hello-llmts) | First LLM Call | `invoke()`, basic setup |
| [02-models-config.ts](#02-models-configts) | Model Configuration | `temperature`, `maxTokens`, providers |
| [03-messages.ts](#03-messagests) | Message System | `HumanMessage`, `SystemMessage`, `AIMessage` |
| [04-streaming.ts](#04-streamingts) | Real-time Responses | `stream()`, `streamEvents()` |
| [05-structured-output.ts](#05-structured-outputts) | Typed JSON Output | `withStructuredOutput()`, Zod schemas |

---

## Files in Detail

### 01-hello-llm.ts

**Topic:** First interaction with an LLM through LangChain.

```bash
npx tsx src/01-fundamentals/01-hello-llm.ts
```

**What I learned:**
- LangChain provides a unified interface (`ChatAnthropic`, `ChatOpenAI`) for different providers
- The SDK reads API keys automatically from environment variables
- `invoke()` sends messages and returns a typed `AIMessage` with content and metadata
- Token usage is accessible via `response.usage_metadata`

**Key takeaway:** LangChain abstracts away provider differences - switching from Claude to GPT is just changing the import and model name.

---

### 02-models-config.ts

**Topic:** Understanding model parameters and multi-provider support.

```bash
npx tsx src/01-fundamentals/02-models-config.ts
```

**What I learned:**

| Parameter | Effect | Use Case |
|-----------|--------|----------|
| `temperature: 0` | Deterministic output | Classification, extraction |
| `temperature: 1` | Creative/varied output | Brainstorming, creative writing |
| `maxTokens` | Limits response length | Cost control, concise answers |
| `timeout` | Request timeout (ms) | Production reliability |
| `maxRetries` | Auto-retry on failure | Handling rate limits |

**Provider differences:**
- OpenAI/Anthropic use `maxTokens`
- Google uses `maxOutputTokens`
- Google uses `model` instead of `modelName`

**Key takeaway:** Same prompt, different temperatures = completely different outputs. Temperature 0 is essential for reproducible results.

---

### 03-messages.ts

**Topic:** The message system that powers LLM conversations.

```bash
npx tsx src/01-fundamentals/03-messages.ts
```

**Message types:**

| Type | Role | Purpose |
|------|------|---------|
| `SystemMessage` | `system` | Set behavior, personality, constraints |
| `HumanMessage` | `user` | User input, questions |
| `AIMessage` | `assistant` | Model responses |
| `ToolMessage` | `tool` | Tool execution results |

**What I learned:**
- `SystemMessage` is powerful for controlling model behavior (language, tone, format)
- Conversation history is just an array of messages - the model uses context from previous messages
- Few-shot prompting works by providing example Human/AI message pairs
- Multimodal messages support images via content blocks with `type: "image_url"`

**Key takeaway:** The `SystemMessage` is your primary tool for shaping model behavior without changing the prompt itself.

---

### 04-streaming.ts

**Topic:** Real-time response streaming for better UX.

```bash
npx tsx src/01-fundamentals/04-streaming.ts
```

**Streaming methods:**

| Method | Returns | Use Case |
|--------|---------|----------|
| `invoke()` | Complete response | Simple requests, batch processing |
| `stream()` | Token iterator | Chatbots, typing effects |
| `streamEvents()` | Event stream | Debugging, monitoring, fine control |

**What I learned:**
- Streaming dramatically improves perceived performance (2-3x faster time-to-first-token)
- Each chunk is an `AIMessageChunk` that can be concatenated
- `streamEvents()` provides lifecycle events: `on_chat_model_start`, `on_chat_model_stream`, `on_chat_model_end`
- Error handling in streams requires try/catch around the async iterator

**Performance insight:**
```
invoke() total time:       1700ms  (user waits entire time)
stream() time to 1st token: 900ms  (user sees content sooner)
```

**Key takeaway:** Always use streaming for user-facing applications. The UX improvement is significant.

---

### 05-structured-output.ts

**Topic:** Getting typed JSON responses instead of free-form text.

```bash
npx tsx src/01-fundamentals/05-structured-output.ts
```

**Zod schema types:**

| Zod Type | TypeScript | Example |
|----------|------------|---------|
| `z.string()` | `string` | `"hello"` |
| `z.number()` | `number` | `42` |
| `z.boolean()` | `boolean` | `true` |
| `z.array(z.string())` | `string[]` | `["a", "b"]` |
| `z.object({...})` | `{ ... }` | `{ name: "John" }` |
| `z.enum([...])` | union | `"positive" \| "negative"` |
| `z.nullable(z.string())` | `string \| null` | `null` |

**What I learned:**
- `withStructuredOutput(schema)` forces the model to return data matching the Zod schema
- `.describe("...")` on each field helps the LLM understand what to extract
- Nested schemas work great for complex data (e.g., Movie with array of Actors)
- `includeRaw: true` gives access to both parsed data and raw AIMessage metadata
- Structured output is essential for data extraction, classification, and API responses

**Use cases discovered:**
- Sentiment analysis with confidence scores
- Contact extraction from unstructured text
- Recipe generation with typed ingredients/steps arrays
- Movie details with nested cast information

**Key takeaway:** Structured output transforms LLMs from "text generators" to "data extractors". This is fundamental for building reliable applications.

---

## Running the Examples

Each file is self-contained and can be run independently:

```bash
# Run any example
npx tsx src/01-fundamentals/<filename>.ts

# Run all in sequence
for f in src/01-fundamentals/*.ts; do npx tsx "$f"; done
```

## Prerequisites

- Node.js 18+
- At least one API key configured in `.env`:
  - `ANTHROPIC_API_KEY` (Claude)
  - `OPENAI_API_KEY` (GPT)
  - `GOOGLE_API_KEY` (Gemini)

---

## Summary

After completing this module, I understand:

1. **How to communicate with LLMs** - `invoke()` for simple calls, `stream()` for real-time
2. **How to configure models** - Temperature, tokens, timeouts for different use cases
3. **How messages work** - System prompts shape behavior, conversation history provides context
4. **How to get structured data** - Zod schemas for type-safe extraction
5. **Provider abstraction** - LangChain makes switching providers trivial

**Next:** [Module 2 - Tools & Agents](../02-tools/) - Teaching LLMs to use external tools.
