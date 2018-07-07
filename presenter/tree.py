"""TODO"""


class Tree:
    __slots__ = 'nodes', 'leaves'

    def __init__(self, nodes, leaves):
        self.nodes = nodes
        self.leaves = leaves

    def __repr__(self):
        # TODO
        return '{} {}'.format(self.nodes, self.leaves)
