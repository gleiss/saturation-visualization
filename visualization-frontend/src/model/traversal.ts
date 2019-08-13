
import { assert } from "./util";
import Dag from "./dag";
import SatNode from "./sat-node";

// iterator for traversing DAG, where each node is visited only after all parents are visited
// implements standard iterative depth-first postorder traversal
export class DFPostOrderTraversal {
	
	readonly dag: Dag;
	todo: Array<number>;
	visited: Set<number>;
	
	constructor(dag: Dag) {
		this.dag = dag;
		this.todo = Array.from(dag.leaves);
		this.visited = new Set();
	}

	hasNext(): boolean {
		while (this.todo.length > 0) {
			const last = this.todo[length - 1];
			if (this.visited.has(last)) {
				this.todo.pop();
			} else {
				// there exists at least one unvisited node
				return true;
			}
		}
		return false;
	}

	// returns the next node (the actual node, not its id) for traversal
	// note: only call this method after checking for has_next
	getNext(): SatNode {
		while (this.todo.length > 0) {
			const currentId = this.todo[this.todo.length - 1];
			const currentNode = this.dag.get(currentId);

			// if we haven't already visited the current unit
			if (!this.visited.has(currentId)) {
				let existsUnvisitedParent = false;
				
				// add unprocessed parents to stack for DFS.
				// If there is at least one unprocessed parent, don't compute the result
				// for current_id now, but wait until those unprocessed parents are processed.
				for (const parentId of currentNode.parents) {
					// if we haven't visited the parent yet
					if (! this.visited.has(parentId)) {
						// add it to the stack
						this.todo.push(parentId);
						existsUnvisitedParent = true;
					}
				}

				// if we already visited all parents, we can visit the node too
				if (!existsUnvisitedParent) {
					this.visited.add(currentId);
					this.todo.pop();
					return currentNode;
				}
			} else {
				this.todo.pop();
			}
		}
		assert(false, "We have already iterated through all the inferences, so getNext() should not been called");
		return null as unknown as SatNode;
	}
}

// iterator for traversing DAG, where each node is visited before any parent node is visited
// implemented as reversed postorder traversal
export class ReversePostOrderTraversal {
	postOrder: Array<SatNode>;

	constructor(dag: Dag) {
		// compute post order and save result in postOrder
		const it = new DFPostOrderTraversal(dag);
		this.postOrder = [];
		while (it.hasNext()) {
			this.postOrder.push(it.getNext() as SatNode);
		}
	}

	hasNext(): boolean {
		return this.postOrder.length > 0;
	}

	getNext(): SatNode {
		assert(this.hasNext(), "We have already iterated through all the inferences, so getNext() should not have been called");
		return this.postOrder.pop() as SatNode;
	}

}