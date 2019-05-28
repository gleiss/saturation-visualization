import {assert} from './util';
import {Node} from "./node.js";

// Data structure for DAGs which is used to represent saturation derivations.
export class Dag {
	constructor (nodes) {
		this.checkAssertions(nodes);

		this.nodes = nodes;

		// compute leaves
		let leaves = new Set();
		let nonLeaves = new Set();
		this.nodes.values().forEach(node => {
			node.parents.forEach(parent => {
				nonLeaves.add(parent);
			});
		});
		this.nodes.keys().forEach(nodeId => {
			if (! nonLeaves.has(nodeId)) {
				leaves.add(nodeId);
			}
		});
		this.leaves = leaves;

	}

	has(nodeId) {
		return this.nodes.has(nodeId);
	}
	get(nodeId) {
		assert(this.nodes.has(nodeId));
		return this.nodes.get(nodeId);
	}

	numberOfHistorySteps() {
		let counter = 0;
		this.nodes.values().forEach(node => {
			if (node.activeTime !== undefined) {
				counter = counter + 1;
			}
		});
		return counter;
	}
	lastStep() {
		const length = this.numberOfHistorySteps;
		return Math.max(length,0);
	}

	children(nodeId) {
		if (!this.has(nodeId)) {
			assert(false, "Invalid node id: " + nodeId);
		}

		let children = [];
		this.nodes.values().forEach(node => {
			node.parents.forEach(parentId => {
				if (parentId === nodeId) {
					children.push(node.number);
				}
			});
		});
		return children;
	}

	checkAssertions(nodes) {
		
		assert(typeof nodes === "object");
		nodes.keys().forEach(key => {
			assert(typeof key === "number");
		});
		nodes.values().forEach(value => {
			assert(value instanceof Node);
		});
	}
}