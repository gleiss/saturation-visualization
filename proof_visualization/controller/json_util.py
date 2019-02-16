"""Utility functions for JSON."""

import json

from proof_visualization.controller.representation_util import compute_representation


def format_node(node, position, history_state):
    if not node:
        return
    representation = compute_representation(node, history_state)

    return {
        'color': {
            'background': representation.background,
            'border': representation.border,
            'highlight': representation.highlight
        },
        'font': {
            'color': representation.text
        },
        'id': node.number,
        'label': str(node),
        'shape': representation.shape,
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
