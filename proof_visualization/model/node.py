"""Data object representing a line of proof output"""

import proof_visualization.model.util as util


class Node:
    __slots__ = 'number', 'clause', 'inference_rule', 'parents', 'children'

    def __init__(self, number, clause, inference_rule, parents):
        self.number = number
        self.clause = clause
        self.inference_rule = inference_rule
        self.parents = parents
        self.children = set()

    def __str__(self):
        return "{: >5}: {}".format(self.number, util.set_repr(self.parents))

    def __repr__(self):
        return self.clause.replace("'", "") if self.clause else ""
