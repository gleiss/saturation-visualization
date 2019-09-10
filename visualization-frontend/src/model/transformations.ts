import { assert } from "./util";
import { Dag } from "./dag";
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
			const updatedNode = new SatNode(currentNode.id, currentNode.unit, currentNode.inferenceRule, updatedParents, currentNode.statistics, currentNode.isFromPreprocessing, currentNode.newTime, currentNode.passiveTime, currentNode.activeTime, currentNode.deletionTime, currentNode.deletionParents);
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

  // computes the set of clauses currently in Passive, which are derived as children from nodes in selection (or are in the selection for the special case of final preprocessing nodes which are in passive)
  // precondition: selection contains only ids from nodes which either 1) have already been activated or 2) are final preprocessing clauses
  export function passiveDagForSelection(dag: Dag, selectionId: number, currentTime: number): Dag {

    const passiveDagNodes = new Map<number, SatNode>();
	const styleMap = new Map<number, "passive" | "deleted" | "boundary">();
	
    for (const [nodeId, node] of dag.nodes) {
      // a node is in passive, if the new-event happened, but neither an active-event nor a deletion-event happened.
      const nodeIsInPassive = ((node.newTime !== null && node.newTime <= currentTime) && !(node.activeTime !== null && node.activeTime <= currentTime) && !(node.deletionTime !== null && node.deletionTime <= currentTime));
      if (nodeIsInPassive) {
        // compute active clauses or final preprocessing clauses from which node was generated
        const cachedNodes = new Map<number, SatNode>(); // TODO: probably more efficient to delay this
		const cachedStyles = new Map<number, "passive" | "deleted" | "boundary">();

		cachedNodes.set(nodeId, node);
		cachedStyles.set(nodeId, "passive");

        let relevantNodeId = nodeId;
        let relevantNode = dag.get(relevantNodeId);
        // first go up in the derivation until the current node was not derived using a simplification
        while (true) {
          const nodeIdOrNull = nodeWasDerivedUsingSimplification(dag, relevantNode);
          if (nodeIdOrNull !== null) {
            assert(dag.get(nodeIdOrNull).deletionTime !== null);
            for (const parentId of relevantNode.parents) {
              if (parentId !== nodeIdOrNull) {
				cachedNodes.set(parentId, createBoundaryNode(dag, dag.get(parentId)));
				cachedStyles.set(parentId, "boundary");
              }
            }
            relevantNodeId = nodeIdOrNull;
			relevantNode = dag.get(relevantNodeId)
			
			cachedNodes.set(relevantNodeId, relevantNode);
			cachedStyles.set(relevantNodeId, "deleted"); // could be wrong if it is a preprocessing node, but in that case it is corrected later
          } else {
            break;
          }
        }

        // now either the relevant node is a preprocessing node, or the parents of the current node are active nodes
        if (relevantNode.isFromPreprocessing) {
          if (selectionId === relevantNodeId) {
			// add cached nodes and styles
            for (const [nodeId, node] of cachedNodes) {
              passiveDagNodes.set(nodeId, node.copy());
            }
            for (const [nodeId, style] of cachedStyles) {
				styleMap.set(nodeId, style);
			}
			// correct the node and style for preprocessing node
			if(relevantNodeId !== nodeId) {
				passiveDagNodes.set(relevantNodeId, createBoundaryNode(dag, relevantNode));
				styleMap.set(relevantNodeId, "boundary")
			}
          }
        } else {
          for (const parentId of relevantNode.parents) {
            const parent = dag.get(parentId);
            
            assert(parent.activeTime !== null && relevantNode.newTime !== null && parent.activeTime <= relevantNode.newTime, `invar violated for node ${node}`);
          }
          for (const parentId of relevantNode.parents) {
            if (selectionId === parentId) {
			  // add cached nodes and styles
			  for (const [nodeId, node] of cachedNodes) {
                passiveDagNodes.set(nodeId, node.copy());
			  }
			  for (const [nodeId, style] of cachedStyles) {
				styleMap.set(nodeId, style);
			}
			  // add all (active) clauses, which participated in the generating inference, as boundary nodes
              for (const parentId of relevantNode.parents) {
				passiveDagNodes.set(parentId, createBoundaryNode(dag, dag.get(parentId)));
				styleMap.set(parentId, "boundary");
              }
              break;
            }
          }
        }
      }
	}
	
	// add the selected node itself as boundary nodes
	passiveDagNodes.set(selectionId, createBoundaryNode(dag, dag.get(selectionId)));
	if (styleMap.get(selectionId) === undefined) { // don't overwrite style "passive"
		styleMap.set(selectionId, "boundary");
	}

	const passiveDag = new Dag(passiveDagNodes, null, true, styleMap);
	return passiveDag;
  }

  // returns null if node was not derived using simplification
  // returns id of original node if node was derived using simplification
  // TODO: we don't know the complete set of simplifying inference rules, since the current set could be extended in the future. Nonetheless we know the standard simplifying and generating inference rules, so we could use that knowledge to speed up the computation of this function.
  function nodeWasDerivedUsingSimplification(dag: Dag, node: SatNode): number | null {
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
          return parentId;
        }
      }
    }
    return null;
  }