"""TODO"""

__all__ = 'draw'

import pygraphviz as pgv


def position_nodes(tree):
    """TODO

    :param Tree tree: a tree of InferenceNodes
    """
    graph=pgv.AGraph(directed=True)
    for node in tree:
        if node.parents:
            for parent in node.parents:
                graph.add_edge(tree.get(parent), node)
        else:
            graph.add_node(node)

    graph.layout(prog='dot')
    graph.draw('graph.plain')
