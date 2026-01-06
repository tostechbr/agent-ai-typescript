/**
 * 02-nodes.ts
 *
 * Understanding Nodes in LangGraph
 *
 * In this file I learn how to:
 * - Define node functions that process state
 * - Understand that nodes return partial state updates
 * - See how nodes execute in sequence
 * - Understand the difference between sync and async nodes
 *
 * Run: npx tsx src/03-langgraph-basics/02-nodes.ts
 */

import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

// 1. Define State
// Using the same schema from the previous file
const GraphState = Annotation.Root({
  name: Annotation<string>,
  items: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// 2. Define Nodes (Functions)
// Nodes receive the current state and return an update.
// Notice we don't need to return the FULL state, just the fields we want to update.
// Nodes can be synchronous or asynchronous - use async only if you need await.

function nodeA(state: typeof GraphState.State) {
  console.log("--- Executing Node A ---");
  console.log(`Current State: ${JSON.stringify(state)}`);

  // This node sets the name and adds an item
  return {
    name: "Ada Lovelace",
    items: ["First Algorithm"],
  };
}

function nodeB(state: typeof GraphState.State) {
  console.log("--- Executing Node B ---");
  console.log(`Current State from A: ${JSON.stringify(state)}`);

  // This node just adds another item to the list
  // The 'name' field will remain "Ada Lovelace" because we are not overwriting it
  return {
    items: ["Analytical Engine"],
  };
}

// 3. Create the Graph
const workflow = new StateGraph(GraphState)
  .addNode("node_a", nodeA) // Register node A
  .addNode("node_b", nodeB) // Register node B
  // We need to define the flow (Edges) - we'll cover this in depth in 03-edges.ts
  // For now, let's just make a simple sequence: Start -> A -> B -> End
  .addEdge(START, "node_a")
  .addEdge("node_a", "node_b")
  .addEdge("node_b", END);

// 4. Compile the Graph
// This creates the runtime that executes our graph
const app = workflow.compile();

// 5. Run the Graph
async function main() {
  console.log("Starting the graph...\n");

  // Invoke receives the initial state
  // Since 'items' has a default value, we can pass an empty object
  const result = await app.invoke({});

  console.log("\n--- Final Result ---");
  console.log(result);
  console.log("\n Graph execution completed!");
  console.log("   - name: set to 'Ada Lovelace'");
  console.log("   - items: concatenated ['First Algorithm', 'Analytical Engine']");
}

main().catch(console.error);

// Exporting for use in other files
export { GraphState };

