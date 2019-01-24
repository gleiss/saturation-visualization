"""TODO"""

from flask import session

import proof_visualization.controller.json_util as json
from proof_visualization.model.parsing import process
from proof_visualization.model.positioning import calculate_node_positions


def init_controller():
    init_dag_from_file()
    session['history_state'] = len(session['positions']) - 1


def get_layout():
    """Use data stored in session to create a graph layout for vis.js."""

    dag = session.get('dag')
    positions = session.get('positions')
    history_state = int(session['history_state'])
    visible_node_set = {int(node.id_) for node in positions[:history_state + 1]}

    nodes = []
    edges = []

    for index, node_position in enumerate(positions):
        node = dag.get(int(node_position.id_))

        node_visible = index <= history_state
        nodes.append(json.format_node(node, node_position, node_visible))
        for child in node.children:
            edge_visible = int(child) in visible_node_set
            edges.append(json.format_edge(node.number, child, edge_visible))

    return json.dump_graph(nodes, edges, list(dag.nodes.keys()))


def init_dag(file_content):
    dag = process(file_content)
    positions = calculate_node_positions(dag)

    # store in session
    session['dag'] = dag
    session['positions'] = positions


def init_dag_from_file():
    with open('example.proof') as proof_file:
        dag = process(proof_file.read())
        positions = calculate_node_positions(dag)

        # store in session
        session['dag'] = dag
        session['positions'] = positions
