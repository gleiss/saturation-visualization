"""TODO"""

import json

from flask import session

from proof_visualization.model.parsing import process
from proof_visualization.model.positioning import calculate_node_positions

def init_controller():
    init_dag_from_file()
    session['state'] = len(session['positions']) - 1


def get_layout():
    
    dag = session.get('dag')
    positions = session.get('positions')
    state = session['state']
    
    nodes = []
    edges = []

    visibleNodeSet = set(int(node.id_) for node in positions[:int(state)+1])


    for index, node_position in enumerate(positions):
        node = dag.get(int(node_position.id_))


        if index > int(state):
            backgroundColor = '#ffffff00'
            textColor = '#ffffff00'
            
        else:
            backgroundColor = {
                None: '#dddddd',
                'theory axiom': '#77aadd'
            }.get(node.inference_rule, '#99ddff')
            textColor = '#000000'

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
                'border': backgroundColor,
                'background': backgroundColor,
            },
            'font': {
                'color': textColor
            }
        })
        for child in node.children:
            if int(child) in visibleNodeSet:
                opacity = 1.0
            else:
                opacity = 0.0

            edges.append({
                'from': node.number,
                'to': child,
                'arrows': 'to',
                'color': {
                    'opacity': opacity
                }
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
