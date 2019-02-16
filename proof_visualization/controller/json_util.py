"""Utility functions for JSON."""

import json

PREPROCESSING_LABEL = 'Preproc'

# STYLE CONFIG
SHAPES = {
    PREPROCESSING_LABEL: 'box',
    None: 'box'
}
BACKGROUND_COLORS = {
    PREPROCESSING_LABEL: '#44bb99',
    'theory axiom': '#77aadd',
    None: '#dddddd'
}
BORDER_COLORS = {
    PREPROCESSING_LABEL: '#009988',
    'theory axiom': '#4477aa',
    None: '#bbbbbb'
}
INVISIBLE_COLOR = '#ffffff00'
HIGHLIGHT_COLOR = '#ee8866'


def format_node(node, position, visible):
    if not node:
        return
    shape = SHAPES.get(node.inference_rule, SHAPES[None])

    if visible:
        background_color = BACKGROUND_COLORS.get(node.inference_rule, BACKGROUND_COLORS[None])
        border_color = BORDER_COLORS.get(node.inference_rule, BORDER_COLORS[None])
        text_color = '#000000'
    else:
        background_color = INVISIBLE_COLOR
        border_color = INVISIBLE_COLOR
        text_color = INVISIBLE_COLOR

    return {
        'color': {
            'background': background_color,
            'border': border_color,
            'highlight': HIGHLIGHT_COLOR
        },
        'font': {
            'color': text_color
        },
        'id': node.number,
        'label': str(node),
        'shape': shape,
        'x': int(float(position.x_coord) * -100),
        'y': int(float(position.y_coord) * -1000)
    }


def format_edge(parent, child, visible):
    return {
        'arrows': 'to',
        'color': {
            'opacity': 1.0 if visible else 0.0
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
