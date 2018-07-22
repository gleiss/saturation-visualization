"""TODO"""

from collections import deque

from presenter.util import count_repr, title_repr, separator, last_line


class Tree:
    __slots__ = 'nodes', 'leaves'

    def __init__(self, nodes, leaves):
        self.nodes = nodes
        self.leaves = leaves
    
    def get(self, node_id):
        return self.nodes.get(node_id)

    def __iter__(self):
        """TODO

        :return:
        """
        stack = deque(self.leaves)
        while stack:
            next_node = stack.pop()
            stack.extend(self.nodes[parent] for parent in next_node.parents)
            yield next_node

    def __repr__(self):
        title = "Tree with {} and {}".format(
            count_repr(self.nodes, "node", "nodes"),
            count_repr(self.leaves, "leaf", "leaves")
        )

        return "\n".join((
            title_repr(title),
            "\n".join(repr(node) for node in self),
            separator(),
            "\n".join(repr(node) for node in self.leaves),
            last_line()
        ))
