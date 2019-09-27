import { assert } from "./util";
import { Dag, SatNodeStyle } from "./dag";
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
						const boundaryNode = createBoundaryNode(dag.get(parentId));
						
						// boundaryNode has currentNode as child and is therefore no leaf
						assert(!dag.leaves.has(boundaryNode.id), "invar violated. Boundary nodes should only occur as parents of nodes");
						remainingNodes.set(boundaryNode.id, boundaryNode);
					}
				}
			} else {
				// otherwise ignore all parents: introduce a copy of the node which has no parents
				currentNode = createBoundaryNode(currentNode);
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

function createBoundaryNode(node: SatNode): SatNode {
	return new SatNode(node.id, node.unit, node.inferenceRule, [], node.statistics, node.isFromPreprocessing, node.newTime, node.activeTime, node.deletionTime, node.deletionParents, node.isBoundary);
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
	const mergeMap = new Map<number, Array<number>>(); // maps merged nodes to the replacing nodes, needed for extending the dag later

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
					mergeMap.set(parentId, parentNode.parents);
				}
			}
			const updatedNode = new SatNode(currentNode.id, currentNode.unit, currentNode.inferenceRule, updatedParents, currentNode.statistics, currentNode.isFromPreprocessing, currentNode.newTime, currentNode.activeTime, currentNode.deletionTime, currentNode.deletionParents, currentNode.isBoundary);
			nodes.set(currentNodeId, updatedNode);
		}
	}

	// remove merged nodes
	for (const nodeIdToRemove of nodeIdsToRemove) {
		const success = nodes.delete(nodeIdToRemove);
		assert(success, "invar violated");
	}

	return new Dag(nodes, mergeMap);
}

// preconditions:
// - selectionIds contains only ids from nodes which either 1) have already been activated or 2) are final preprocessing clauses
// - selectionIds must contain at least one element
export function passiveDagForSelection(dag: Dag, selectionIds: Array<number>, currentTime: number): Dag {
	assert(selectionIds.length > 0);
	const selectionIdsSet = new Set(selectionIds);

	// Part 1: compute the set of passive nodes, which was generated using a generating inference from nodes in selectionIds
	const foundNodes = new Set<number>();

	for (const [nodeId, node] of dag.nodes) {
		// a node is in passive, if the new-event happened, but neither an active-event nor a deletion-event happened.
		const nodeIsInPassive = ((node.newTime !== null && node.newTime <= currentTime) && !(node.activeTime !== null && node.activeTime <= currentTime) && !(node.deletionTime !== null && node.deletionTime <= currentTime));
		if (nodeIsInPassive) {
			// compute activated clauses or final preprocessing clauses from which node was generated
			// const cachedNodes = new Map<number, SatNode>(); // TODO: probably more efficient to delay this
			// const cachedStyles = new Map<number, "passive" | "deleted" | "boundary">();

			// cachedNodes.set(nodeId, node);
			// cachedStyles.set(nodeId, "passive");

			let relevantNode = node;

			// first go up in the derivation until the current node was not derived using a simplification
			while (true) {
				const mainPremise: SatNode | null = nodeWasDerivedUsingSimplification(dag, relevantNode);
				if (mainPremise === null) {
					break;
				} else {
					relevantNode = mainPremise;
				}
			}

			// now either the relevant node is a preprocessing node, or the parents of the current node are active nodes
			if (relevantNode.isFromPreprocessing) {
				if (selectionIdsSet.size === 1 && selectionIdsSet.has(relevantNode.id)) {
					// found a passive node where the relevant node from activeDag is contained in selection
					foundNodes.add(nodeId);
				}
			} else {
				// sanity check that we found a generating inference
				for (const parentId of relevantNode.parents) {
					const parent = dag.get(parentId);
					assert(parent.activeTime !== null && relevantNode.newTime !== null && parent.activeTime <= relevantNode.newTime, "invar violated: parent is not premise of a generating inference of relevantNode");
					assert(parent.activeTime !== null && parent.activeTime <= currentTime, "invar violated: parent must occur in current activeDag!");
				}

				let allSelectionNodesAreParents = true;
				for (const selectionNodeId of selectionIdsSet) {
					if (relevantNode.parents.find(parentId => parentId === selectionNodeId) === undefined) {
						allSelectionNodesAreParents = false;
						break;
					}
				}
				if (allSelectionNodesAreParents) {
					foundNodes.add(nodeId);
				}
			}
		}
	}

	// Part 2:
	// we now know the set of passive nodes, so
	// - collect all nodes participating in the derivation of the passive nodes from nodes in the current activeDag
	// - compute for each such node its style
	const passiveDagNodes = new Map<number, SatNode>();
	const nodePartition = new Map<number, SatNodeStyle>();

	const relevantNodes = new Set<number>(foundNodes);

	// additionally display each node from selection, even if no passive node is generated by the node
	for (const nodeId of selectionIds) {
		relevantNodes.add(nodeId);
	}

	const iterator = new ReversePostOrderTraversal(dag);
	while (iterator.hasNext()) {
		const node = iterator.getNext();
		const nodeId = node.id;

		if (relevantNodes.has(nodeId)) {
			const isDeleted = (node.deletionTime !== null && node.deletionTime <= currentTime);

			// compute whether the derivation should be extended with the parents of the node, and compute the style of the node
			let isBoundary;
			let style;
			if (foundNodes.has(nodeId)) {
				assert(!isDeleted);
				if (node.isFromPreprocessing) {
					isBoundary = true;
					style = "passive";
				} else {
					isBoundary = false;
					style = "passive";
				}
			} else if (dag.nodeIsTheoryAxiom(nodeId)) {
				isBoundary = true;
				style = isDeleted ? "theory-axiom-deleted" : "theory-axiom";
			} else if (node.isFromPreprocessing) {
				if (node.inferenceRule === "negated conjecture") {
					isBoundary = true;
					style = "conjecture";
				} else {
					isBoundary = true;
					style = isDeleted ? "preprocessing-deleted" : "preprocessing";
				}
			} else if (node.activeTime !== null && node.activeTime <= currentTime) {
				isBoundary = true;
				style = isDeleted ? "activated-deleted" : "activated";
			} else {
				isBoundary = false;
				style = "deleted";
			}

			if (isBoundary) {
				passiveDagNodes.set(nodeId, createBoundaryNode(node));
			} else {
				passiveDagNodes.set(nodeId, node.copy()); // copy node so that positioning passiveDag will not change positioning of original dag
				for (const parent of node.parents) {
					relevantNodes.add(parent);
				}
			}
			nodePartition.set(nodeId, style);
		}
	}

	const passiveDag = new Dag(passiveDagNodes, null, true, nodePartition, selectionIds[0]);
	return passiveDag;
}

  // returns null if node was not derived using simplification
  // returns id of original node if node was derived using simplification
  // TODO: we don't know the complete set of simplifying inference rules, since the current set could be extended in the future. Nonetheless we know the standard simplifying and generating inference rules, so we could use that knowledge to speed up the computation of this function.
  function nodeWasDerivedUsingSimplification(dag: Dag, node: SatNode): SatNode | null {
    // one of the parents p of node n needs to satisfy the following four properties (independently from the currentTime):
    for (const parentId of node.parents) {
      const parent = dag.get(parentId);
      // 1) n has been added to saturation and p has been deleted
      // 2) the deletionTime of p matches the newTime of n.
      // 3) the first deletion parent of p is n
      // 4) let P be the set of parents of n other than p. Then the deletion parents of p are n and P.
      if (node.newTime !== null && parent.deletionTime !== null && parent.deletionTime === node.newTime && parent.deletionParents[0] === node.id && node.parents.length === parent.deletionParents.length) {
        const set1 = new Set<number>(node.parents);
        set1.delete(parentId);
        const set2 = new Set<number>(parent.deletionParents);
        set2.delete(parent.deletionParents[0]);
        let otherParentsMatch = true;
        for (const e of set1) {
          if (!set2.has(e)) {
            otherParentsMatch = false;
          }
        }
        if (otherParentsMatch) {
          return parent;
        }
      }
    }
    return null;
  }