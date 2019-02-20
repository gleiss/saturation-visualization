import proof_visualization.model.util as util
from proof_visualization.model.node import Node

# datastructure for DAGs, which we use to represent proofs
class Dag:
    def __init__(self, nodes):
        self._check_assertions(nodes)

        self.nodes = nodes
        
        # compute leaves
        leaves = set()
        nonLeaves = set()
        for node in nodes.values():
            for parent in node.parents:
                nonLeaves.add(parent)
        for nodeId in nodes:
            if not nodeId in nonLeaves:
                leaves.add(nodeId)
        self.leaves = leaves

    def get(self, node_id):
        assert node_id
        assert node_id in self.nodes
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

    def numberOfHistorySteps(self):
        counter = 0
        for node in self.nodes.values():
            if node.active_time:
                counter = counter + 1
        return counter
        
    def lastStep(self):
        length = self.numberOfHistorySteps()
        return max(length, 0)

    @staticmethod
    def _check_assertions(nodes):
        assert isinstance(nodes, dict)
        for key, value in nodes.items():
            assert isinstance(key, int)
            assert isinstance(value, Node)

