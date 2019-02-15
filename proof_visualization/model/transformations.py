from proof_visualization.model.dag import Dag
from proof_visualization.model.node import Node
from proof_visualization.model.traversal import DFPostOrderTraversal
from proof_visualization.model.traversal import ReversePostOrderTraversal

# returns a new dag containing only the nodes which either
# have an id in relevantIds or
# are transitive parents of a node with id in relevantIds
def filterNonParents(dag, relevantIds):
	assert isinstance(dag, Dag)
	assert isinstance(relevantIds, set)
	for relevantId in relevantIds:
		assert isinstance(relevantId, int)

	# use new set to avoid mutating relevantIds
	transitiveParents = relevantIds

	# need to compute remaining nodes and remaining leaves of new dag
	remainingNodes = dict()
	remainingLeaves = set()

	# add all transitive parents of transitiveParents to transitiveParents
	iterator = ReversePostOrderTraversal(dag)
	while(iterator.hasNext()):
		currentNode = iterator.next()
		currentNodeId = currentNode.number

		# if currentNode is relevant 
		if (currentNodeId in transitiveParents):

			# mark parents relevant
			for parentId in currentNode.parents:
				transitiveParents.add(parentId)

			# add node to remainingNodes
			remainingNodes[currentNodeId] = currentNode

			# if leaf, add node also to remainingLeaves
			if currentNodeId in dag.leaves:
				remainingLeaves.add(currentNodeId)

	return Dag(remainingNodes, remainingLeaves)