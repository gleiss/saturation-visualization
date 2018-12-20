"""TODO"""

import json

from flask import session

from proof_visualization.model.parsing import process
from proof_visualization.model.positioning import calculate_node_positions


def get_layout(state=None):
    dag = session.get('dag')
    positions = session.get('positions')

    if not dag:
        with open('example.proof') as proof_file:
            dag = process(proof_file.read())
            positions = calculate_node_positions(dag)

            # store in session
            session['dag'] = dag
            session['positions'] = positions

    nodes = []
    edges = []

    for node_position in positions:
        node = dag.get(int(node_position.id_))
        color = {
            None: '#dddddd',
            'theory axiom': '#77aadd'
        }.get(node.inference_rule, '#99ddff')

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
