

# iterator for traversing DAG, where each node is visited only after all parents are visited
# implements standard iterative depth-first postorder traversal
class DFPostOrderTraversal:
    def __init__(self, dag):
        self.dag = dag
        self.todo = list(dag.leaves)
        self.visited = set()

    def has_next(self):
        while len(self.todo) > 0:
            last = self.todo[-1]
            if last in self.visited:
                self.todo.pop()
            else:
                # there exists at least one unvisited node
                return True
        return False

    # returns the next node (the actual node, not its id) for traversal
    # only call after checking for has_next
    def get_next(self):
        while len(self.todo) > 0:
            current_id = self.todo[-1]
            current_node = self.dag.get(current_id)

            # if we haven't already visited the current unit
            if current_id not in self.visited:
                exists_unvisited_parent = False

                # add unprocessed parents to stack for DFS.
                # If there is at least one unprocessed parent, don't compute the result
                # for current_id now, but wait until those unprocessed parents are processed.
                for parent in current_node.parents:

                    # if we haven't visited the parent yet
                    if parent not in self.visited:
                        # add it to the stack
                        self.todo.append(parent)
                        exists_unvisited_parent = True

                # if we already visited all parents, we can visit the node too
                if not exists_unvisited_parent:
                    self.visited.add(current_id)
                    self.todo.pop()
                    return current_node
            else:
                self.todo.pop()

        # we have already iterated through all inferences, so next() should not have been called
        assert False


# iterator for traversing DAG, where each node is visited before any parent node is visited
# implemented as reversed postorder traversal
class ReversePostOrderTraversal:
    def __init__(self, dag):
        # compute post order and save result in postOrder
        it = DFPostOrderTraversal(dag)
        self.postOrder = list()
        while it.has_next():
            self.postOrder.append(it.get_next())

    def has_next(self):
        return len(self.postOrder) > 0

    def get_next(self):
        assert (self.has_next())
        return self.postOrder.pop()
