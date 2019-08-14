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

	return new Dag(remainingNodes);
}

// returns a new dag containing only the nodes which either
// have an id in relevant_ids or
// are transitive children of a node with id in relevant_ids.
// additionally keeps boundary nodes
export function filterNonConsequences(dag: Dag, relevantIds: Set<number>) {
	// use new set to avoid mutating relevantIds
	const transitiveChildrenIds = new Set(relevantIds);

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

	return new Dag(remainingNodes);
}

// create a boundary node, which has the same id as the Node node, but as inference "Boundary" and no parents
function createBoundaryNode(dag: Dag, node: SatNode): SatNode {
	return new SatNode(node.id, node.unit, "Boundary", [], node.statistics, node.isFromPreprocessing, node.newTime, node.passiveTime, node.activeTime, node.deletionTime, node.deletionParents);
}



// # remove all nodes, which are not used to derive any clause which is activated at some point
// # (note that the derivation of an activated clause can contain never activated passive nodes or even clauses which have
// # never been added to passive)
// def filter_non_active_deriving_nodes(dag):
//     # collect all active nodes
//     activated_nodes = set()
//     for _, node in dag.nodes.items():
//         if node.active_time is not None:
//             activated_nodes.add(node.number)

//     # remove all nodes which are not transitive parents of activated nodes
//     transformed_dag = filter_non_parents(dag, activated_nodes)

//     return transformed_dag


// # vampire performs preprocessing in multiple steps
// # we are only interested in
// # 1) the input-formulas (and axioms added by Vampire)
// # 2) the clauses resulting from them
// # We therefore merge together all preprocessing steps into single steps
// # from input-formulas/vapire-added-axioms to final-preprocessing-clauses
// # additionally remove all choice axiom parents, since we treat them as part of the background theory
// def merge_preprocessing(dag):
//     post_order_traversal = DFPostOrderTraversal(dag)
//     while post_order_traversal.has_next():
//         current_node = post_order_traversal.get_next()

//         # if there is a preprocessing node n1 with a parent node n2 which has itself a parent node n3,
//         # then replace n2 by n3 in the parents of n1
//         if current_node.is_from_preprocessing:
//             new_parents = []
//             for parent_id in current_node.parents:
//                 parent_node = dag.get(parent_id)
//                 assert parent_node.is_from_preprocessing

//                 if len(parent_node.parents) == 0:
//                     if parent_node.inference_rule != "choice axiom":
//                         new_parents.append(parent_id)

//                 for parent_2_id in parent_node.parents:
//                     parent_2_node = dag.get(parent_2_id)
//                     assert parent_2_node.is_from_preprocessing

//                     new_parents.append(parent_2_id)

//             current_node.parents = new_parents

//     # remove unused nodes like n2.
//     # not that they are now not reachable anymore from the leaves of the dag
//     remaining_nodes = dict()
//     post_order_traversal_2 = DFPostOrderTraversal(dag)
//     while post_order_traversal_2.has_next():
//         current_node = post_order_traversal_2.get_next()
//         current_id = current_node.number
//         remaining_nodes[current_id] = current_node

//     return Dag(remaining_nodes)
