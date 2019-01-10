"""TODO"""

import json

from flask import session

from proof_visualization.model.parsing import process
from proof_visualization.model.positioning import calculate_node_positions


def get_layout(state=None):
    if not session.get('dag'):
        init_dag_from_file()

    dag = session.get('dag')
    positions = session.get('positions')

    nodes = []
    edges = []

    if not state:
        state = len(positions) - 1
    for index, node_position in enumerate(positions):
        node = dag.get(int(node_position.id_))

        if index <= int(state):
            color = {
                None: '#dddddd',
                'theory axiom': '#77aadd'
            }.get(node.inference_rule, '#99ddff')
        else:
            color = '#ffffff'

        nodes.append({
            'id': node.number,
            'label': str(node),
            'x': int(float(node_position.x_coord) * -100),
            'y': int(float(node_position.y_coord) * -1000),
            'shape': 'box' if node.clause else 'ellipse',
            'shapeProperties': {
                'borderRadius': 0
            },
            'color': {
                'border': color,
                'background': color
            }
        })
        for child in node.children:
            edges.append({
                'from': node.number,
                'to': child,
                'arrows': 'to'
            })

    data = json.dumps({
        'graph': {
            'nodes': nodes,
            'edges': edges
        },
        'order': list(dag.nodes.keys())
    })

    return data


def init_dag_from_file():
    with open('example.proof') as proof_file:
        dag = process(proof_file.read())
        positions = calculate_node_positions(dag)

        # store in session
        session['dag'] = dag
        session['positions'] = positions
