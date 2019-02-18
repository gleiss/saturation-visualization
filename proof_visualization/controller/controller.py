"""TODO"""

from flask import session

import proof_visualization.controller.json_util as json
from proof_visualization.controller.representation_util import compute_representation, legend
from proof_visualization.model.dag import Dag
from proof_visualization.model.parsing import process
from proof_visualization.model.positioning import calculate_node_positions


def init_controller():
    init_dag_from_file()
    session['history_state'] = session['total_history_length'] - 1


def get_layout():
    """Use data stored in session to create a graph layout for vis.js."""

    dag = session.get('dag')
    positions = session.get('positions')
    history_state = int(session['history_state'])

    nodes = []
    edges = []

    for node_position in positions:
        node = dag.get(int(node_position.id_))
        if node:
            edge_data = []
            has_visible_children = False

            # define edges to child nodes
            for child in node.children:
                child_node = dag.get(int(child))
                if child_node:
                    edge_visible = child_node.passive_time and child_node.passive_time <= history_state
                    edge_data.append((node.number, child, edge_visible))
                    if edge_visible:
                        has_visible_children = True

            # append representation jsons for node and edges
            representation = compute_representation(node, history_state, has_visible_children)
            nodes.append(json.format_node(node, node_position, representation))
            for entry in edge_data:
                edges.append(json.format_edge(*entry))

    return json.dump_graph(nodes, edges, list(dag.nodes.keys()))


def get_legend():
    return legend()


def reduce_to_selection(dag, selection):
    selected_nodes = {dag.get(selected_node) for selected_node in selection}

    # use copy for iteration so that selection_nodes can be updated
    for node in list(selected_nodes):
        node.parents = []
        selected_nodes.update(dag.get(child) for child in node.children)

    nodes = {node.number: node for node in selected_nodes}

    return Dag(nodes)


def init_dag(file_content):
    dag, history_length = process(file_content)
    positions = calculate_node_positions(dag)

    # store in session
    session['dag'] = dag
    session['positions'] = positions
    session['total_history_length'] = history_length


def init_selection_dag(selection):
    # store dag for reset
    session['old_dag'] = session['dag']
    session['old_positions'] = session['positions']

    # generate new dag
    dag = reduce_to_selection(session['dag'], {int(node_id) for node_id in selection})
    positions = calculate_node_positions(dag)

    # store in session
    session['dag'] = dag
    session['positions'] = positions
    session['history_state'] = session.get('total_history_length') - 1


def reset_dag():
    if session.get('old_dag'):
        session['dag'] = session['old_dag']
        session['positions'] = session['old_positions']


def init_dag_from_file():
    with open('example.proof') as proof_file:
        dag, history_length = process(proof_file.read())
        positions = calculate_node_positions(dag)

        # store in session
        session['dag'] = dag
        session['positions'] = positions
        session['total_history_length'] = history_length
