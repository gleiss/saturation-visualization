import proof_visualization.model.util as util
from proof_visualization.model.node import Node


class Dag:
    def __init__(self, nodes, leaves):
        self._check_assertions(nodes, leaves)

        self.nodes = nodes
        self.leaves = leaves

        # compute children
        for _, node in nodes.items():
            for parent in node.parents:
                try:
                    nodes[parent].children.add(node.number)
                except KeyError:
                    print("parent id: " + str(parent))
                    assert(False)
                    # LOG.info('Clause %d is derived from (non-final) pre-processing clause %d', node.number, parent)
                    # parent_node = Node(parent, PREPROCESSING_LABEL, PREPROCESSING_LABEL, [], [])
                    # parent_node.children.add(node.number)
                    # nodes[parent] = parent_node


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
    def _check_assertions(nodes, leaves):
        assert isinstance(nodes, dict)
        for key, value in nodes.items():
            assert isinstance(key, int)
            assert isinstance(value, Node)
        for leaf in leaves:
            assert isinstance(leaf, int)
