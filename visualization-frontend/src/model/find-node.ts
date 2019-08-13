import Dag from "./dag";
import { DFPostOrderTraversal } from "./traversal";

// return ids of nodes, which have a derivation where each of the nodes in relevantIds occurs
export function findCommonConsequences(dag: Dag, relevantIds: Set<number>): Array<number> {

	// want to compute common consequences
	const commonConsequences = new Array<number>();

	// create dictionary which maps the id of each node to the subset of relevantIds occuring in the derivation of the node
	const idToRelevantParentIds = new Map<number, Set<number>>();

	// add all transitive children of ids in transitiveChildren to transitiveChildren
	const iterator = new DFPostOrderTraversal(dag);
	while (iterator.hasNext()) {
		const currentNode = iterator.getNext();
		const currentNodeId = currentNode.id;

		const relevantParents = new Set<number>();
		// compute relevant parents and update dictionary
		if (relevantIds.has(currentNodeId)) {
			relevantParents.add(currentNodeId);
		}
		for (const parentId of currentNode.parents) {
			const relevantParentIdsFromParent = idToRelevantParentIds.get(parentId) as Set<number>;
			// merge relevantParentIdsFromParent into relevantParents
			for (const relevantParentId of relevantParentIdsFromParent) {
				relevantParents.add(relevantParentId);
			}
		}
		idToRelevantParentIds.set(currentNodeId, relevantParents);

		// check whether each relevant id occurs in relevant parents
		if (relevantIds.size === relevantParents.size) {
			commonConsequences.push(currentNodeId);
		}
	}
	
	return commonConsequences;
}