"""Utility functions for JSON."""

import json

PREPROCESSING_LABEL = 'Preproc'

# STYLE CONFIG
SHAPES = {
    PREPROCESSING_LABEL: 'ellipse',
    None: 'box'
}
BACKGROUND_COLORS = {
    PREPROCESSING_LABEL: '#dddddd',
    'theory axiom': '#77aadd',
    None: '#99ddff'
}
INVISIBLE_COLOR = '#ffffff00'


def format_node(node, position, visible):
    shape = SHAPES.get(node.inference_rule, SHAPES[None])

    if visible:
        background_color = BACKGROUND_COLORS.get(node.inference_rule, BACKGROUND_COLORS[None])
        text_color = '#000000'
    else:
        background_color = INVISIBLE_COLOR
        text_color = INVISIBLE_COLOR

    return {
        'color': {
            'background': background_color,
            'border': background_color
        },
        'font': {
            'color': text_color
        },
        'id': node.number,
        'label': str(node),
        'shape': shape,
        'shapeProperties': {
            'borderRadius': 0
        },
        'x': int(float(position.x_coord) * -100),
        'y': int(float(position.y_coord) * -1000)
    }


def format_edge(parent, child, visible):
    return {
        'arrows': 'to',
        'color': {
            'opacity': float(visible)
        },
        'from': parent,
        'to': child
    }


def dump_graph(nodes, edges, order):
    return json.dumps({
        'graph': {
            'nodes': nodes,
            'edges': edges
        },
        'order': order
    })
