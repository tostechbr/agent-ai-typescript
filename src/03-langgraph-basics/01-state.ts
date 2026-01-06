/**
 * 01-state.ts
 *
 * Understanding State in LangGraph
 *
 * In this file I learn how to:
 * - Define state schema using Annotation.Root
 * - Use simple fields (strings, numbers)
 * - Use reducers for arrays (to append instead of replace)
 * - Understand how state updates work
 *
 * Run: npx tsx src/03-langgraph-basics/01-state.ts
 */

import { Annotation } from "@langchain/langgraph";

// 1. State is the "memory" of our graph.
// It defines the format of data that will be passed between steps (nodes).
// We use Annotation.Root to define the schema of our state.

const GraphState = Annotation.Root({
  // We can define simple fields
  // Here we define a 'name' field that is just a string.
  // If a node returns { name: "New Name" }, this value will be overwritten.
  name: Annotation<string>,

  // We can also define how fields should be updated (Reducers)
  // By default, LangGraph overwrites the previous value.
  // But for lists, like messages, we usually want to add (append).

  // Here we define 'items' as a list of strings.
  // The reducer (x, y) => x.concat(y) ensures that new items are added to the existing list.
  // x = current state, y = new value returned by the node
  items: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// Just showing that the object was created - in future files we'll use this in StateGraph
console.log("--- State Schema ---");
console.log("State defined successfully.");
console.log("Defined fields:", Object.keys(GraphState.spec));

// Let's simulate how state works conceptually
console.log("\n--- Conceptual Simulation ---");
console.log("1. Initial State: { items: [], name: undefined }");
console.log("2. Node A returns: { items: ['Apple'], name: 'John' }");
console.log("   -> State becomes: { items: ['Apple'], name: 'John' }");
console.log("3. Node B returns: { items: ['Banana'] }");
console.log("   -> State becomes: { items: ['Apple', 'Banana'], name: 'John' }");
console.log("   (Items concatenated, Name maintained)");

// Exporting for use in other files
export { GraphState };

