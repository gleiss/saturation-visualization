"""Data object representing a line of proof output"""

import proof_visualization.model.util as util


class Node:
    __slots__ = [
        'number',
        'clause',
        'inference_rule',
        'parents',
        'children',
        'statistics',
        'is_from_preprocessing',
        'passive_time',
        'active_time'
    ]

    def __init__(self, number, clause, inference_rule, parents, statistics):
        self._check_assertions(number, clause, inference_rule, parents, statistics)

        self.number = number
        self.clause = util.remove_quotes(clause)
        self.inference_rule = inference_rule
        self.parents = parents
        self.children = set()

        self.statistics = statistics

        self.is_from_preprocessing = False
        self.passive_time = None
        self.active_time = None

    def set_passive_time(self, line_number):
        assert isinstance(line_number, int)
        self.passive_time = line_number

    def set_active_time(self, line_number):
        assert isinstance(line_number, int)
        self.active_time = line_number

        if not self.passive_time:
            self.passive_time = self.active_time

    def __str__(self):
        return self.clause

    def __repr__(self):
        return self.clause

    @staticmethod
    def _check_assertions(number, clause, inference_rule, parents, statistics):
        assert isinstance(number, int)
        assert isinstance(clause, str)
        assert isinstance(inference_rule, str)
        assert isinstance(parents, list)
        assert isinstance(statistics, list)
        for parent in parents:
            assert isinstance(parent, int)
        for stat in statistics:
            assert isinstance(stat, int)
