"""Data structure for DAGs which is used to represent proofs."""

import proof_visualization.model.util as util
from proof_visualization.model.node import Node


class Dag:
    def __init__(self, nodes):
        self._check_assertions(nodes)

        self.nodes = nodes

        # compute leaves
        leaves = set()
        non_leaves = set()
        for node in nodes.values():
            for parent in node.parents:
                non_leaves.add(parent)
        for node_id in nodes:
            if node_id not in non_leaves:
                leaves.add(node_id)
        self.leaves = leaves

    def get(self, node_id):
        # TODO use self.nodes[node_id] instead
        return self.nodes.get(node_id)

    def __iter__(self):
        for node in self.nodes.values():
            yield node

    def __repr__(self):
        title = "Tree with {} and {}".format(
            util.count_repr(self.nodes, singular="node", plural="nodes"),
            util.count_repr(self.leaves, singular="leaf", plural="leaves")
        )
        return "\n".join((
            util.title_repr(title),
            "\n".join(repr(node) for node in self),
            util.separator(),
            "\n".join(repr(node) for node in self.leaves),
            util.last_line()
        ))

    def number_of_history_steps(self):
        return sum(node.active_time is not None for node in self.nodes.values())

    def last_step(self):
        length = self.number_of_history_steps()
        return max(length, 0)

    def children(self, node_id):
        if not self.nodes.get(node_id):
            raise Exception('Invalid node id {}'.format(node_id))

        children = []
        for node in self.nodes.values():
            for parent_id in node.parents:
                if parent_id == node_id:
                    children.append(node.number)
        return children

    @staticmethod
    def _check_assertions(nodes):
        assert isinstance(nodes, dict)
        for key, value in nodes.items():
            assert isinstance(key, int)
            assert isinstance(value, Node)
