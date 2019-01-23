"""Data object representing a line of proof output"""

import proof_visualization.model.util as util


class Node:
    __slots__ = 'number', 'clause', 'inference_rule', 'parents', 'children'

    def __init__(self, number, clause, inference_rule, parents):
        self._check_assertions(number, clause, inference_rule, parents)

        self.number = number
        self.clause = util.remove_quotes(clause)
        self.inference_rule = inference_rule
        self.parents = parents
        self.children = set()

    def __str__(self):
        return self.clause

    def __repr__(self):
        return self.clause

    @staticmethod
    def _check_assertions(number, clause, inference_rule, parents):
        assert isinstance(number, int)
        assert isinstance(clause, str)
        assert isinstance(inference_rule, str)
        assert isinstance(parents, list)
        for parent in parents:
            assert isinstance(parent, int)
