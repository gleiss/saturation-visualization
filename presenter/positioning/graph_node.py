"""TODO"""


class GraphNode:
    __slots__ = 'node', 'level'

    def __init__(self, node, level):
        self.node = node
        self.level = level

    def __repr__(self):
        # TODO
        return '{}\n'.format(self.node, self.level)
