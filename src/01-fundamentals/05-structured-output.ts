/**
 * 05-structured-output.ts
 *
 * Getting typed JSON responses from LLMs with Zod!
 *
 * In this file I learn how to:
 * - Use withStructuredOutput() to get typed data
 * - Define schemas with Zod
 * - Handle optional fields and arrays
 * - Build complex nested schemas
 *
 * Run: npx tsx src/01-fundamentals/05-structured-output.ts
 */

import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { z } from "zod";

// Base model
const model = new ChatOpenAI({
  modelName: "gpt-4.1-mini",
  temperature: 0,
});

/**
 * Without structured output:
 *   LLM returns: "The capital of France is Paris, with a population of 2.1M"
 *   You need to: Parse this text manually (error-prone!)
 *
 * With structured output:
 *   LLM returns: { city: "Paris", country: "France", population: 2100000 }
 *   You get: Type-safe data ready to use!
 */

async function demoSimpleSchema() {
  console.log("=".repeat(60));
  console.log("DEMO 1: Simple Schema");
  console.log("=".repeat(60));

  // Define the schema with Zod
  const CitySchema = z.object({
    name: z.string().describe("The name of the city"),
    country: z.string().describe("The country where the city is located"),
    population: z.number().describe("Approximate population"),
    isCapital: z.boolean().describe("Whether it is the capital city"),
  });

  // Create a model with structured output
  const structuredModel = model.withStructuredOutput(CitySchema);

  console.log("\nAsking about Tokyo...\n");

  const result = await structuredModel.invoke([
    new HumanMessage("Tell me about Tokyo"),
  ]);

  console.log("Raw result:", result);
  console.log("\nTyped access:");
  console.log(`  City: ${result.name}`);
  console.log(`  Country: ${result.country}`);
  console.log(`  Population: ${result.population.toLocaleString()}`);
  console.log(`  Is Capital: ${result.isCapital}`);

  // TypeScript knows the types!
  // result.name -> string
  // result.population -> number
}

async function demoOptionalFields() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 2: Optional and Nullable Fields");
  console.log("=".repeat(60));

  const MovieSchema = z.object({
    title: z.string().describe("Movie title"),
    year: z.number().describe("Release year"),
    director: z.string().describe("Director name"),
    rating: z.number().describe("Rating out of 10"),
    sequel: z.nullable(z.string()).describe("Name of sequel, if any"),
    budget: z.nullable(z.number()).describe("Budget in millions USD, if known"),
  });

  const structuredModel = model.withStructuredOutput(MovieSchema);

  console.log("\nAsking about Inception...\n");

  const result = await structuredModel.invoke([
    new HumanMessage("Tell me about the movie Inception"),
  ]);

  console.log("Result:", JSON.stringify(result, null, 2));
  console.log(`\nSequel: ${result.sequel ?? "No sequel"}`);
}

async function demoArrays() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 3: Arrays and Lists");
  console.log("=".repeat(60));

  const RecipeSchema = z.object({
    name: z.string().describe("Recipe name"),
    prepTime: z.number().describe("Preparation time in minutes"),
    ingredients: z.array(z.string()).describe("List of ingredients"),
    steps: z.array(z.string()).describe("Cooking steps in order"),
    difficulty: z.enum(["easy", "medium", "hard"]).describe("Difficulty level"),
  });

  const structuredModel = model.withStructuredOutput(RecipeSchema);

  console.log("\nAsking for a pasta recipe...\n");

  const result = await structuredModel.invoke([
    new HumanMessage("Give me a simple pasta carbonara recipe"),
  ]);

  console.log(`Recipe: ${result.name}`);
  console.log(`Prep Time: ${result.prepTime} minutes`);
  console.log(`Difficulty: ${result.difficulty}`);
  console.log(`\nIngredients (${result.ingredients.length}):`);
  result.ingredients.forEach((ing, i) => console.log(`  ${i + 1}. ${ing}`));
  console.log(`\nSteps (${result.steps.length}):`);
  result.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
}

async function demoNestedObjects() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 4: Nested Objects");
  console.log("=".repeat(60));

  // Define nested schemas
  const ActorSchema = z.object({
    name: z.string().describe("Actor's full name"),
    role: z.string().describe("Character name in the movie"),
  });

  const MovieDetailsSchema = z.object({
    title: z.string().describe("Movie title"),
    year: z.number().describe("Release year"),
    director: z.string().describe("Director's name"),
    cast: z.array(ActorSchema).describe("Main cast members"),
    genres: z.array(z.string()).describe("Movie genres"),
  });

  const structuredModel = model.withStructuredOutput(MovieDetailsSchema);

  console.log("\nAsking for details about The Dark Knight...\n");

  const result = await structuredModel.invoke([
    new HumanMessage("Give me details about The Dark Knight movie"),
  ]);

  console.log(`${result.title} (${result.year})`);
  console.log(`Director: ${result.director}`);
  console.log(`Genres: ${result.genres.join(", ")}`);
  console.log(`\nCast:`);
  result.cast.forEach((actor) => {
    console.log(`  - ${actor.name} as ${actor.role}`);
  });
}

async function demoEnums() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 5: Enums and Classifications");
  console.log("=".repeat(60));

  const SentimentSchema = z.object({
    text: z.string().describe("The analyzed text"),
    sentiment: z
      .enum(["positive", "negative", "neutral"])
      .describe("Overall sentiment"),
    confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
    emotions: z
      .array(z.enum(["joy", "sadness", "anger", "fear", "surprise", "disgust"]))
      .describe("Detected emotions"),
  });

  const structuredModel = model.withStructuredOutput(SentimentSchema);

  const texts = [
    "I absolutely love this product! Best purchase ever!",
    "The service was terrible and I want a refund.",
    "The package arrived on time.",
  ];

  console.log("\nAnalyzing sentiments...\n");

  for (const text of texts) {
    const result = await structuredModel.invoke([
      new SystemMessage("Analyze the sentiment of the given text."),
      new HumanMessage(text),
    ]);

    console.log(`Text: "${text.substring(0, 40)}..."`);
    console.log(`  Sentiment: ${result.sentiment} (${(result.confidence * 100).toFixed(0)}%)`);
    console.log(`  Emotions: ${result.emotions.join(", ") || "none"}`);
    console.log();
  }
}

async function demoDataExtraction() {
  console.log("=".repeat(60));
  console.log("DEMO 6: Data Extraction from Text");
  console.log("=".repeat(60));

  const ContactSchema = z.object({
    name: z.string().describe("Person's full name"),
    email: z.nullable(z.string()).describe("Email address if found"),
    phone: z.nullable(z.string()).describe("Phone number if found"),
    company: z.nullable(z.string()).describe("Company name if mentioned"),
    role: z.nullable(z.string()).describe("Job title/role if mentioned"),
  });

  const structuredModel = model.withStructuredOutput(ContactSchema);

  const unstructuredText = `
    Hi, my name is Sarah Johnson and I work as a Senior Developer at TechCorp Inc.
    You can reach me at sarah.johnson@techcorp.com or call me at (555) 123-4567.
    Looking forward to our meeting next week!
  `;

  console.log("\nExtracting contact info from email...\n");
  console.log(`Input text: "${unstructuredText.trim().substring(0, 60)}..."`);

  const result = await structuredModel.invoke([
    new SystemMessage("Extract contact information from the text."),
    new HumanMessage(unstructuredText),
  ]);

  console.log("\nExtracted data:");
  console.log(`  Name: ${result.name}`);
  console.log(`  Email: ${result.email ?? "Not found"}`);
  console.log(`  Phone: ${result.phone ?? "Not found"}`);
  console.log(`  Company: ${result.company ?? "Not found"}`);
  console.log(`  Role: ${result.role ?? "Not found"}`);
}

async function demoIncludeRaw() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 7: Including Raw Response");
  console.log("=".repeat(60));

  const SimpleSchema = z.object({
    answer: z.string().describe("The answer to the question"),
    confidence: z.number().describe("Confidence level 0-100"),
  });

  // Include raw response for debugging/metadata
  const structuredModel = model.withStructuredOutput(SimpleSchema, {
    includeRaw: true,
  });

  console.log("\nGetting response with raw message...\n");

  const result = await structuredModel.invoke([
    new HumanMessage("What is 2 + 2?"),
  ]);

  console.log("Parsed data:", result.parsed);

  // Cast to AIMessage to access metadata properties
  const rawMessage = result.raw as AIMessage;

  console.log("\nRaw AIMessage metadata:");
  console.log(`  Model: ${rawMessage.response_metadata?.model ?? "N/A"}`);
  console.log(`  Input tokens: ${rawMessage.usage_metadata?.input_tokens ?? "N/A"}`);
  console.log(`  Output tokens: ${rawMessage.usage_metadata?.output_tokens ?? "N/A"}`);
}

async function main() {
  console.log("\n🎯 Structured Output with Zod Tutorial\n");

  await demoSimpleSchema();
  await demoOptionalFields();
  await demoArrays();
  await demoNestedObjects();
  await demoEnums();
  await demoDataExtraction();
  await demoIncludeRaw();

  console.log("\n" + "=".repeat(60));
  console.log("Summary: Zod Schema Types");
  console.log("=".repeat(60));
  console.log(`
  | Zod Type              | Example                              |
  |-----------------------|--------------------------------------|
  | z.string()            | "hello"                              |
  | z.number()            | 42                                   |
  | z.boolean()           | true                                 |
  | z.array(z.string())   | ["a", "b", "c"]                      |
  | z.object({...})       | { name: "John", age: 30 }            |
  | z.enum([...])         | "positive" | "negative" | "neutral"  |
  | z.nullable(z.string())| "value" | null                       |
  | .describe("...")      | Helps LLM understand the field       |
  `);
  console.log("=".repeat(60));
}

main().catch(console.error);
