import re
from collections import namedtuple

#import pygraphviz as pgv

PLAIN_PATTERN = re.compile(r'node (\d+) ([0-9.]+) ([0-9.]+).+')

NodePosition = namedtuple('NodePosition', ['id_', 'x_coord', 'y_coord'])


def calculate_node_positions(proof_dag):
    """Use pygraphviz to calculate node positions and return the result as a list of NodePositions"""

    #graph = pgv.AGraph(directed=True)
#
    #for node in proof_dag:
    #    graph.add_node(node.number, label=node.clause)
#
    #for node in proof_dag:
    #    for parent in node.parents:
    #        graph.add_edge(parent, node.number)
    #graph.layout(prog='dot')

    # need to save result in file, since that's how pygraphviz works
    file_name = 'graph.plain'
    #graph.draw(file_name)

    with open(file_name) as graph_positions:
        node_positions = []
        for line in graph_positions.read().split('\n'):
            match = re.match(PLAIN_PATTERN, line)
            if match:
                node_positions.append(NodePosition(*match.groups()))

        return node_positions
