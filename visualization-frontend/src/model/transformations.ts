import { assert } from "./util";
import Dag from "./dag";
import SatNode from "./sat-node";
import { ReversePostOrderTraversal, DFPostOrderTraversal } from "./traversal";

// returns a new dag containing only the nodes which either
// have an id in relevantIds or
// are transitive parents of a node with id in relevantIds
export function filterNonParents(dag: Dag, relevantIds: Set<number>) {
	// use new set to avoid mutating relevantIds
	const transitiveParentIds = new Set(relevantIds);

	// need to compute remaining nodes
	const remainingNodes = new Map<number, SatNode>();

	// add all transitive parents of transitive_parents to transitiveParents
	const iterator = new ReversePostOrderTraversal(dag);
	while (iterator.hasNext()) {
		const currentNode = iterator.getNext();
		const currentNodeId = currentNode.id;

		// if currentNode is relevant
		if (transitiveParentIds.has(currentNodeId)) {
			
			// mark parents relevant
			currentNode.parents.forEach(parentId => transitiveParentIds.add(parentId));

			// add node to remainingNodes
			remainingNodes.set(currentNodeId,currentNode);
		}
	}

	// create deep copy of nodes
	// needed so that layout computation for the transformed dag does not overwrite the layout of the original dag
	const remainingNodesDeepCopy = new Map<number, SatNode>();
	for (const [nodeId,node] of remainingNodes) {
		remainingNodesDeepCopy.set(nodeId, node.copy());
	}
	return new Dag(remainingNodesDeepCopy);
}

// returns a new dag containing only the nodes which either
// have an id in relevant_ids or
// are transitive children of a node with id in relevant_ids.
// additionally keeps boundary nodes
export function filterNonConsequences(dag: Dag, relevantIds: Set<number>) {
	// use new set to avoid mutating relevantIds
	const transitiveChildrenIds = new Set<number>(relevantIds);

	// need to compute remaining nodes
	const remainingNodes = new Map<number, SatNode>();

	// add all transitive children of ids in transitiveChildren to transitiveChildren
	const iterator = new DFPostOrderTraversal(dag);
	while (iterator.hasNext()) {
		let currentNode = iterator.getNext();

		// check if currentNode occurs in transitiveChildren or
		// has a parent which occurs in transitiveChildren
		let existsRelevantParent = false;
		for (const parentId of currentNode.parents) {
			if (transitiveChildrenIds.has(parentId)) {
				existsRelevantParent = true;
			}
		}
		const isRelevant = transitiveChildrenIds.has(currentNode.id) || existsRelevantParent;

		if (isRelevant) {
			// add its id to the set of relevant ids
			transitiveChildrenIds.add(currentNode.id);

			// if there exists at least one relevant parent, 
			if (existsRelevantParent) {
				// introduce a boundary nodes for all nonrelevant parents
				for (const parentId of currentNode.parents) {
					if (!transitiveChildrenIds.has(parentId)) {
						const boundaryNode = createBoundaryNode(dag, dag.get(parentId));
						
						// boundaryNode has currentNode as child and is therefore no leaf
						assert(!dag.leaves.has(boundaryNode.id), "invar violated. Boundary nodes should only occur as parents of nodes");
						remainingNodes.set(boundaryNode.id, boundaryNode);
					}
				}
			} else {
				// otherwise ignore all parents: introduce a copy of the node which has no parents
				currentNode = createBoundaryNode(dag, currentNode);
			}

			// add currentNode to remainingNodes
			remainingNodes.set(currentNode.id, currentNode);
		} 
	}

	// create deep copy of nodes
	// needed so that layout computation for the transformed dag does not overwrite the layout of the original dag
	const remainingNodesDeepCopy = new Map<number, SatNode>();
	for (const [nodeId,node] of remainingNodes) {
		remainingNodesDeepCopy.set(nodeId, node.copy());
	}
	return new Dag(remainingNodesDeepCopy);
}

// create a boundary node, which has the same id as the Node node, but as inference "Boundary" and no parents
function createBoundaryNode(dag: Dag, node: SatNode): SatNode {
	return new SatNode(node.id, node.unit, "Boundary", [], node.statistics, node.isFromPreprocessing, node.newTime, node.passiveTime, node.activeTime, node.deletionTime, node.deletionParents);
}

// vampire performs preprocessing in multiple steps
// we are only interested in
// 1) the input-formulas (and axioms added by Vampire)
// 2) the clauses resulting from them
// We therefore merge together all preprocessing steps into single steps
// from input-formulas/vapire-added-axioms to final-preprocessing-clauses
// additionally remove all choice axiom parents, since we treat them as part of the background theory
export function mergePreprocessing(dag: Dag): Dag {
	const nodes = new Map<number, SatNode>(dag.nodes);
	const nodeIdsToRemove = new Set<number>(); // nodes which should be removed. note that we can't remove them upfront due to the fact that the derivation is a dag and not a tree

	const postOrderTraversal = new DFPostOrderTraversal(dag);
	while (postOrderTraversal.hasNext()) {
		// note: the ids are still valid, but the nodes may have been replaced by new node
		const currentNodeId = postOrderTraversal.getNext().id;
		const currentNode = nodes.get(currentNodeId) as SatNode;

		// if there is a preprocessing node n1 with a parent node n2 which has itself a parent node n3,
		// then replace n2 by n3 in the parents of n1 and add n2 to the nodes which should be removed
		if (currentNode.isFromPreprocessing) {
			const updatedParents = new Array<number>();
			for (const parentId of currentNode.parents) {
				const parentNode = nodes.get(parentId) as SatNode;
				assert(parentNode.isFromPreprocessing, "invariant violated");

				if (parentNode.parents.length === 0) {
					// small optimization: remove choice axioms, which should not been added to the proof by Vampire in the first place
					if (parentNode.inferenceRule === "choice axiom") {
						nodeIdsToRemove.add(parentId);
					} else {
						updatedParents.push(parentId);
					}
				} else {
					for (const parent2Id of parentNode.parents) {
						const parent2Node = nodes.get(parent2Id) as SatNode;
						assert(parent2Node.isFromPreprocessing, "invariant violated");
						updatedParents.push(parent2Id);
					}
					nodeIdsToRemove.add(parentId);
				}
			}
			const updatedNode = new SatNode(currentNode.id, currentNode.unit, currentNode.inferenceRule, updatedParents, currentNode.statistics, currentNode.isFromPreprocessing, currentNode.newTime, currentNode.passiveTime, currentNode.activeTime, currentNode.deletionTime, currentNode.deletionParents);
			nodes.set(currentNodeId, updatedNode);
		}
	}

	// remove merged nodes
	for (const nodeIdToRemove of nodeIdsToRemove) {
		const success = nodes.delete(nodeIdToRemove);
		assert(success, "invar violated");
	}

	// return new dag
	return new Dag(nodes);
}