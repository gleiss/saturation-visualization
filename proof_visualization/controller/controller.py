"""TODO"""

from flask import session

import proof_visualization.controller.json_util as json
from proof_visualization.controller.representation_util import compute_representation, legend
from proof_visualization.model.parsing import process
from proof_visualization.model.positioning import calculate_node_positions
import proof_visualization.model.transformations as transformations


def init_controller():
    with open('example.proof') as proof_file:
        file_content = proof_file.read()
        init_dag(file_content)
    session['history_state'] = session['dags'][0].last_step()


def init_dag(file_content):
    dag = process(file_content)
    positions = calculate_node_positions(dag)

    # store in session
    session['dags'] = [dag]
    session['positions'] = [positions]


def get_layout():
    """Use data stored in session to create a graph layout for vis.js."""

    dag = session.get('dags')[-1]
    positions = session.get('positions')[-1]
    history_state = int(session['history_state'])

    nodes = []
    edges = []

    for node_position in positions:
        node = dag.get(int(node_position.id_))
        assert node

        # append representation jsons for node
        representation = compute_representation(node, history_state)
        nodes.append(json.format_node(node, node_position, representation))

        # append representation jsons for edges
        edge_visible = node.is_from_preprocessing or (node.new_time is not None and node.new_time <= history_state)

        for parent_id in node.parents:
            parent_node = dag.get(parent_id)
            assert parent_node

            edge_data = (parent_id, node.number, edge_visible)
            edges.append(json.format_edge(*edge_data))

    return json.dump_graph(nodes, edges, list(dag.nodes.keys()))


def get_legend():
    return legend()


def filter_non_consequences(selection):
    old_dag = session['dags'][-1]

    # generate new dag
    relevant_node_ids = set()
    for e in selection:
        relevant_node_ids.add(int(e))
    dag = transformations.filter_non_consequences(old_dag, relevant_node_ids)
    positions = calculate_node_positions(dag)

    # store in session
    session['dags'].append(dag)
    session['positions'].append(positions)
    session['history_state'] = dag.last_step()


def filter_non_parents(selection):
    old_dag = session['dags'][-1]

    # generate new dag
    relevant_node_ids = set()
    for e in selection:
        relevant_node_ids.add(int(e))
    dag = transformations.filter_non_parents(old_dag, relevant_node_ids)
    positions = calculate_node_positions(dag)

    # store in session
    session['dags'].append(dag)
    session['positions'].append(positions)
    session['history_state'] = dag.last_step()


def reset_dag():
    if session.get('dags') and session.get('positions'):
        session['dags'].pop()
        session['positions'].pop()
