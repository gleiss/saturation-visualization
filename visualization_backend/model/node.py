"""Data object representing a line of proof output"""

from model import util

class Node:
    def __init__(self, number, clause, inference_rule, parents, statistics, is_from_preprocessing):
        self._check_assertions(number, clause, inference_rule, parents, statistics, is_from_preprocessing)

        self.number = number
        self.clause = util.remove_quotes(clause)
        self.inference_rule = inference_rule
        self.parents = parents
        self.children = []

        self.statistics = statistics

        self.is_from_preprocessing = is_from_preprocessing
        self.new_time = None
        self.passive_time = None
        self.active_time = None
        self.deletion_time = None
        self.deletion_parents = None

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

    def set_deletion_time(self, line_number):
        assert isinstance(line_number, int)
        assert self.new_time is not None
        assert self.deletion_time is None
        self.deletion_time = line_number
        self.deletion_parents = []

    def add_deletion_parent(self, deletion_parent):
        assert isinstance(deletion_parent, int)
        assert self.deletion_time is not None
        self.deletion_parents.append(deletion_parent)

    def set_clause(self, clause):
        assert isinstance(clause, str)
        self.clause = clause

    def set_statistics(self, statistics):
        assert isinstance(statistics, dict)
        for key, value in statistics.items():
            assert isinstance(key, str)
            assert isinstance(value, int)
        self.statistics = statistics

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
        for parent in parents:
            assert isinstance(parent, int)
        assert isinstance(statistics, dict)
        for key, value in statistics.items():
            assert isinstance(key, str)
            assert isinstance(value, int)
        assert isinstance(is_from_preprocessing, bool)
