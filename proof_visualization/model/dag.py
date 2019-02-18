import proof_visualization.model.util as util
from proof_visualization.model.node import Node

# datastructure for DAGs, which we use to represent proofs
class Dag:
    def __init__(self, nodes):
        self._check_assertions(nodes)

        self.nodes = nodes
        
        # compute leaves
        self.leaves = {node.number for node in nodes.values() if not node.children}
        
        # compute children
        for _, node in self.nodes.items():
            for parent in node.parents:
                try:
                    self.nodes[parent].children.add(node.number)
                except KeyError:
                    print("parent id: " + str(parent))
                    assert(False)

    def get(self, node_id):
        assert node_id
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

    @staticmethod
    def _check_assertions(nodes):
        assert isinstance(nodes, dict)
        for key, value in nodes.items():
            assert isinstance(key, int)
            assert isinstance(value, Node)

