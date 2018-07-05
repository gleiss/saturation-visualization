class InferenceNode:
    __slots__ = 'number', 'clause', 'inference_rule', 'parents', 'children'

    def __init__(self, number, clause, inference_rule, parents):
        self.number = number
        self.clause = clause
        self.inference_rule = inference_rule
        self.parents = parents
        self.children = set()

    def __repr__(self):
        return 'Node #{} | {} | {}\n'.format(str(self.number).ljust(3),
                                             (str(self.parents) if self.parents
                                              else '-').ljust(10),
                                             self.children if self.children
                                             else '-')
