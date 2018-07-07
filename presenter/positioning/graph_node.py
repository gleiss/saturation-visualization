"""TODO"""


class GraphNode:
    __slots__ = 'node', 'parents', 'level'

    def __init__(self, node, level):
        self.node = node
        self.parents = node.parents
        self.level = level

    def __repr__(self):
        # TODO
        return '{}\n'.format(self.node, self.level)
