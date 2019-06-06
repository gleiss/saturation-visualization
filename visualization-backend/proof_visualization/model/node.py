"""Data object representing a line of proof output"""

import proof_visualization.model.util as util


class Node:
    def __init__(self, number, clause, inference_rule, parents, statistics, is_from_preprocessing):
        self._check_assertions(number, clause, inference_rule, parents, statistics, is_from_preprocessing)

        self.number = number
        self.clause = util.remove_quotes(clause)
        self.inference_rule = inference_rule
        self.parents = parents

        self.statistics = statistics

        self.is_from_preprocessing = is_from_preprocessing
        self.new_time = None
        self.passive_time = None
        self.active_time = None

    def set_new_time(self, line_number):
        assert isinstance(line_number, int)
        assert self.new_time is None
        assert self.passive_time is None
        assert self.active_time is None
        self.new_time = line_number

    def set_passive_time(self, line_number):
        assert isinstance(line_number, int)
        assert self.new_time is not None
        assert self.passive_time is None
        assert self.active_time is None
        self.passive_time = line_number

    def set_active_time(self, line_number):
        assert isinstance(line_number, int)
        assert self.new_time is not None
        assert self.passive_time is not None
        assert self.active_time is None
        self.active_time = line_number

    def __str__(self):
        return self.clause

    def __repr__(self):
        return self.clause

    @staticmethod
    def _check_assertions(number, clause, inference_rule, parents, statistics, is_from_preprocessing):
        assert isinstance(number, int)
        assert isinstance(clause, str)
        assert isinstance(inference_rule, str)
        assert isinstance(parents, list)
        assert isinstance(statistics, list)
        for parent in parents:
            assert isinstance(parent, int)
        for stat in statistics:
            assert isinstance(stat, int)
        assert isinstance(is_from_preprocessing, bool)
