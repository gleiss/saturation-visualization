import re
from collections import namedtuple

import pygraphviz as pgv

PLAIN_PATTERN = re.compile(
    r'^node \"[ ]{0,4}(\d+): [^\"]+\" ([0-9.]+) ([0-9.]+) .+$')

NodePosition = namedtuple('NodePosition', ['id_', 'x_coord', 'y_coord'])


def calculate_node_positions(proof_dag):
    """Use pygraphviz to calculate node positions and return the result as a list of NodePositions"""

    graph = pgv.AGraph(directed=True)
    for node in proof_dag:
        if node.parents:
            for parent in node.parents:
                graph.add_edge(proof_dag.get(parent), node)
        else:
            graph.add_node(node)
    graph.layout(prog='dot')

    # need to save result in file, since that's how pygraphviz works
    file_name = 'graph.plain' 
    graph.draw(file_name)

    with open(file_name) as graph_positions:
        node_positions = []
        for line in graph_positions.read().split('\n'):
            match = re.match(PLAIN_PATTERN, line)
            if match:
                node_positions.append(NodePosition(*match.groups()))

        return node_positions
