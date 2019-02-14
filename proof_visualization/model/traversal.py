from proof_visualization.model.dag import Dag
from proof_visualization.model.node import Node

class PostOrderTraversal:
	def __init__(self, dag):
		self.dag = dag
		self.todo = list(dag.leaves)
		self.visited = set()

	def hasNext(self):
		return len(self.todo) > 0

	# returns the next node (the actual node, not its id) for traversal 
	# only call after checking for hasNext
	# implements standard iterative post order DAG-traversal
	def next(self):
		while len(self.todo) > 0:
			currentId = self.todo[-1]
			currentNode = self.dag.get(currentId)

			# if we haven't already visited the current unit
			if not currentId in self.visited:
				existsUnvisitedParent = False
				
				# add unprocessed parents to stack for DFS. 
				# If there is at least one unprocessed parent, don't compute the result
                # for currentId now, but wait until those unprocessed parents are processed.
				for parent in currentNode.parents:
					
					# if we haven't visited the parent yet
					if not parent in self.visited:
						
						# add it to the stack
						self.todo.append(parent)
						existsUnvisitedParent = True
				
				# if we already visited all parents, we can visit the node too
				if not existsUnvisitedParent:
					self.visited.add(currentId)
					self.todo.pop()
					return currentNode
			else:
				self.todo.pop()
		
		# we have already iterated through all inferences, so next() should not have been called
		assert(False)