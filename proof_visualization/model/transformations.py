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

	# need to compute remaining nodes
	remainingNodes = dict()

	# add all transitive parents of transitiveParents to transitiveParents
	iterator = ReversePostOrderTraversal(dag)
	while(iterator.hasNext()):
		currentNode = iterator.getNext()
		currentNodeId = currentNode.number

		# if currentNode is relevant 
		if (currentNodeId in transitiveParents):

			# mark parents relevant
			for parentId in currentNode.parents:
				transitiveParents.add(parentId)

			# add node to remainingNodes
			remainingNodes[currentNodeId] = currentNode

	return Dag(remainingNodes)

# returns a new dag containing only the nodes which either
# have an id in relevantIds or
# are transitive children of a node with id in relevantIds.
# additionally keeps boundary nodes
def filterNonConsequences(dag, relevantIds):
	assert isinstance(dag, Dag)
	assert isinstance(relevantIds, set)
	for relevantId in relevantIds:
		assert isinstance(relevantId, int)

	# use new set to avoid mutating relevantIds
	transitiveChildren = relevantIds

	# need to compute remaining nodes
	remainingNodes = dict()

	# add all transitive children of ids in transitiveChildren to transitiveChildren
	postOrderTraversal = DFPostOrderTraversal(dag)
	while(postOrderTraversal.hasNext()):
		currentNode = postOrderTraversal.getNext()
		currentNodeId = currentNode.number

		# check if currentNode occurs in transitiveChildren or 
		# has a parent which occurs in transitiveChildren
		existsRelevantParent = False
		for parentId in currentNode.parents:
			if parentId in transitiveChildren:
				existsRelevantParent = True
		isRelevant = (currentNodeId in transitiveChildren) or existsRelevantParent

		if isRelevant:
			# add its id to the set of relevant ids
			transitiveChildren.add(currentNodeId)

			# if there exists at least one relevant parent, introduce boundary nodes for all nonrelevant parents
			if existsRelevantParent:
				# add a boundary node for each parent which doesn't occurs in transitiveChildren
				for parentId in currentNode.parents:
					if not parentId in transitiveChildren:
						boundaryNode = createBoundaryNode(dag, dag.get(parentId))
						boundaryNodeId = boundaryNode.number
						
						assert(not boundaryNodeId in dag.leaves) # boundaryNode has currentNode as child and is therefore no leaf 
						remainingNodes[boundaryNodeId] = boundaryNode
			
			# otherwise ignore all parents: introduce a copy of the node which has no parents
			else:
				currentNode = createBoundaryNode(dag, currentNode)
				
			# add node to remainingNodes
			remainingNodes[currentNodeId] = currentNode

	return Dag(remainingNodes)

# create a boundary node, which has the same id as the Node node, but as inference "Boundary" and no parents
def createBoundaryNode(dag,node):
	assert(isinstance(dag, Dag))
	assert(isinstance(node, Node))

	boundaryNode = Node(node.number, node.clause, "Boundary", [], node.statistics, node.is_from_preprocessing)
	if node.new_time != None:
		boundaryNode.set_new_time(node.new_time)
	if node.passive_time != None:
		boundaryNode.set_passive_time(node.passive_time)
	if node.active_time != None:
		boundaryNode.set_active_time(node.active_time)

	return boundaryNode

# remove all nodes, which are not used to derive any clause which is activated at some point
# (note that the derivation of an activated clause can contain never activated passive nodes or even clauses which have never been added to passive)
def filterNonActiveDerivingNodes(dag):

	# collect all active nodes
	activatedNodes = set()
	for _, node in dag.nodes.items():
		if node.active_time != None:
			activatedNodes.add(node.number)
		
	# remove all nodes which are not transitive parents of activated nodes
	transformedDag = filterNonParents(dag, activatedNodes)

	return transformedDag

		

