# Contributing to TypeScript Agents

First off, thank you for considering contributing to this project! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/agent-ai-typescript.git
   cd agent-ai-typescript
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/tostechbr/agent-ai-typescript.git
   ```

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/tostechbr/agent-ai-typescript/issues)
- If not, create a new issue using the bug report template
- Include as much detail as possible

### Suggesting Features

- Open an issue using the feature request template
- Describe the feature and why it would be useful
- Be open to discussion

### Improving Documentation

- Fix typos, clarify explanations, add examples
- Documentation improvements are always welcome!

### Submitting Code

- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it
- Follow the pull request process below

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run an example
npx tsx src/01-fundamentals/01-hello-llm.ts

# Type check
npm run typecheck
```

### Project Structure

```
src/
├── 01-fundamentals/    # LLM basics
├── 02-tools/           # Tool calling
├── 03-langgraph-basics/ # LangGraph intro
└── ...                 # More modules
```

## Pull Request Process

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the style guide

3. **Test your changes**:
   ```bash
   npm run typecheck
   ```

4. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add new example for streaming"
   ```
   
   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation only
   - `refactor:` code refactoring
   - `chore:` maintenance tasks

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

7. **Wait for review** - maintainers will review your PR and may request changes

## Style Guide

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add comments for complex logic

### File Naming

- Use kebab-case for files: `my-file-name.ts`
- Prefix with numbers for ordering: `01-hello-llm.ts`

### Code Example

```typescript
// ✅ Good
const fetchUserData = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// ❌ Avoid
const f = async (id: any) => {
  return await api.get("/users/" + id);
};
```

## Questions?

Feel free to open an issue with the `question` label if you have any questions!

---

Thank you for contributing! 🚀

