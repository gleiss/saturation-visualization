"""TODO"""

__all__ = ['align_vertically']


def align_vertically(tree):
    """

    :param Tree tree: a tree of InferenceNodes
    :return: a tree of graph nodes with vertical alignment set
    :rtype: Tree
    """
    if len(tree.leaves) > 1:
        raise NotImplementedError('Not implemented yet')  # TODO

    pass
