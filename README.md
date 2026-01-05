# TypeScript Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![LangChain](https://img.shields.io/badge/LangChain-JS-green.svg)](https://js.langchain.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Learning project: Building AI Agents from scratch using LangChain and LangGraph with TypeScript.

## About

This repository documents my journey learning to build AI agents using **LangChain** and **LangGraph** in TypeScript. Each module covers a specific topic with practical examples.

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **LangChain** - Framework for building LLM applications
- **LangGraph** - Framework for building stateful agents
- **Zod** - Schema validation

## Project Structure

```
src/
├── 01-fundamentals/         # LLM basics, messages, streaming, structured output [DONE]
├── 02-tools/                # Custom tools, Zod validation, agents [DONE]
├── 03-langgraph-basics/     # State, nodes, edges, conditional logic
├── 04-calculator-agent/     # Project: Calculator agent
├── 05-memory/               # Short & long-term memory
├── 06-advanced-streaming/   # Advanced streaming patterns
├── 07-human-in-the-loop/    # Interrupts, approvals, state editing
├── 08-multi-agent/          # Subagents, routers, handoffs, supervisors
├── 09-retrieval-rag/        # RAG architectures (2-step, agentic, hybrid)
├── 10-production-security/  # Guardrails, context engineering, MCP
├── 11-advanced/             # Subgraphs, time-travel, durable execution
├── 12-rag-agent-project/    # Project: Complete RAG agent
└── 13-final-project/        # Project: Personal assistant
```

## Topics Covered

### Core Concepts
- Chat Models & Configuration
- Message Types (Human, AI, System, Tool)
- Tools & Tool Calling
- Streaming Responses
- Structured Output with Zod

### LangGraph
- State Management
- Nodes & Edges
- Conditional Routing
- Checkpointers & Persistence

### Advanced Topics
- Memory (Short-term & Long-term)
- Human-in-the-Loop
- Multi-Agent Architectures
- RAG (Retrieval-Augmented Generation)
- Guardrails & Security
- Model Context Protocol (MCP)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Anthropic API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/tostechbr/agent-ai-typescript.git
cd agent-ai-typescript

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run an example
npx tsx src/01-fundamentals/01-hello-llm.ts
```

## Progress

- [x] Module 1: Fundamentals
- [x] Module 2: Tools & Agents
- [ ] Module 3: LangGraph Basics
- [ ] Module 4: Calculator Agent (Project)
- [ ] Module 5: Memory
- [ ] Module 6: Advanced Streaming
- [ ] Module 7: Human-in-the-Loop
- [ ] Module 8: Multi-Agent
- [ ] Module 9: Retrieval & RAG
- [ ] Module 10: Production & Security
- [ ] Module 11: Advanced Topics
- [ ] Module 12: RAG Agent (Project)
- [ ] Module 13: Personal Assistant (Final Project)

## Resources

- [LangChain JS Docs](https://js.langchain.com/)
- [LangGraph JS Docs](https://langchain-ai.github.io/langgraphjs/)
- [Anthropic Docs](https://docs.anthropic.com/)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

## Author

**Tiago Santos**

## License

MIT
