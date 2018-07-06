"""A data object for inferences"""


class InferenceNode:
    __slots__ = 'number', 'clause', 'inference_rule', 'parents', 'children'

    def __init__(self, number, clause, inference_rule, parents):
        self.number = number
        self.clause = clause
        self.inference_rule = inference_rule
        self.parents = parents
        self.children = set()

    def __repr__(self):
        return '#{} {}\n' \
            .format(self.number, self.parents if self.parents else '-')
