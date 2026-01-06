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

import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

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

// Just showing that the object was created
console.log("--- State Schema ---");
console.log("State defined successfully.");
console.log("Defined fields:", Object.keys(GraphState.spec));

// Now let's create a REAL graph to see state updates in action!
// This is the "fluid and dynamic" version - actual execution, not simulation

// Define nodes that will actually update the state
const nodeA = (state: typeof GraphState.State) => {
  console.log("\n[Node A executing]");
  console.log("Current state:", state);
  // Return an update to the state
  return {
    items: ["Apple"],
    name: "John",
  };
};

const nodeB = (state: typeof GraphState.State) => {
  console.log("\n[Node B executing]");
  console.log("Current state:", state);
  // Return an update - items will be concatenated, name stays the same
  return {
    items: ["Banana"],
  };
};

// Create the actual graph
const graphBuilder = new StateGraph(GraphState)
  .addNode("nodeA", nodeA)
  .addNode("nodeB", nodeB)
  .addEdge(START, "nodeA")
  .addEdge("nodeA", "nodeB")
  .addEdge("nodeB", END);

// Compile the graph
const graph = graphBuilder.compile();

// Now let's execute it with REAL state updates!
async function demonstrateState() {
  console.log("\n--- Real Execution (Dynamic State) ---");
  console.log("1. Initial State: {} (default values will be applied)");

  // Invoke the graph - this will actually execute nodes and update state
  // Since 'items' has a default value, we can pass an empty object or explicitly set values
  const finalState = await graph.invoke({});

  console.log("\n2. Final State after execution:");
  console.log(finalState);
  console.log("\n State was updated dynamically during execution!");
  console.log("   - items: concatenated ['Apple', 'Banana']");
  console.log("   - name: overwritten to 'John'");
}

// Run the demonstration
demonstrateState().catch(console.error);

// Exporting for use in other files
export { GraphState };

