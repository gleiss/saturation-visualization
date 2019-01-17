import proof_visualization.model.util as util
from proof_visualization.model.node import Node
import logging

class Dag:
    def __init__(self, nodes, leaves):
        assert(isinstance(nodes,dict))
        for key, value in nodes.items():
            assert(isinstance(key, int))
            assert(isinstance(value, Node)) 
        for leaf in leaves:
            if not isinstance(leaf, int):
                logging.error(type(leaf))
                assert(False)
        self.nodes = nodes
        self.leaves = leaves

    def get(self, node_id):
        assert(node_id)
        return self.nodes.get(node_id)

    def __iter__(self):
        for node in self.nodes.values():
            yield node

    def __repr__(self):
        title = "Tree with {} and {}".format(
            util.count_repr(self.nodes, "node", "nodes"),
            util.count_repr(self.leaves, "leaf", "leaves")
        )
        return "\n".join((
            util.title_repr(title),
            "\n".join(repr(node) for node in self),
            util.separator(),
            "\n".join(repr(node) for node in self.leaves),
            util.last_line()
        ))
