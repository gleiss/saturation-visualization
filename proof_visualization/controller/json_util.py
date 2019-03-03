"""Utility functions for JSON."""

import json


def format_node(node, position, representation):
    return {
        'color': {
            'background': representation.default_style.background,
            'border': representation.default_style.border,
            'highlight': {
                'background': representation.highlight_style.background,
                'border': representation.highlight_style.border
            },
            'marked': {
                'background': representation.marked_style.background,
                'border': representation.marked_style.border
            },
            'default': {
                'background': representation.default_style.background,
                'border': representation.default_style.border
            }
        },
        'font': {
            'color': representation.text
        },
        'id': node.number,
        'label': str(node),
        'rule': node.inference_rule,
        'shape': representation.shape,
        'x': int(float(position.x_coord) * -70),
        'y': int(float(position.y_coord) * -120)
    }


def format_edge(parent, child, visible):
    return {
        'arrows': 'to',
        'color': {
            'opacity': 1.0 if visible else 0.0,
            'color': '#dddddd'
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
