"""TODO"""

__all__ = 'draw'

import pygraphviz as pgv
import io
import json
import logging
import os
import re

import visualizer.parsing.vampire_parser as parser


def position_nodes(tree):
    """TODO

    :param Tree tree: a tree of InferenceNodes
    """
    graph=pgv.AGraph(directed=True)
    for node in tree:
        if node.parents:
            for parent in node.parents:
                graph.add_edge(tree.get(parent), node)
        else:
            graph.add_node(node)

    graph.layout(prog='dot')
    graph.draw('graph.plain')

def generate():
    with open('example.proof') as proof_file:
        proof = parser.parse(proof_file.read())

    position_nodes(proof)

    pattern = re.compile(
        r'^node \"[ ]{0,4}(\d+): [^\"]+\" ([0-9.]+) ([0-9.]+) .+$'
    )

    nodes = []
    edges = []

    with open('graph.plain') as graph_positions:
        for line in graph_positions.read().split('\n'):
            match = re.match(pattern, line)
            if match:
                id_, x_coord, y_coord = match.groups()

                node = proof.get(int(id_))
                color = {
                    None: '#dddddd',
                    'theory axiom': '#77aadd'
                }.get(node.inference_rule, '#99ddff')

                nodes.append({
                    'id': node.number,
                    'label': str(node),
                    'x': int(float(x_coord) * -100),
                    'y': int(float(y_coord) * -1000),
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
            'order': list(proof.nodes.keys())
        })

        with open(os.path.join('static', 'js', 'dag.js'), 'w') as json_file:
            json_file.write("const dagJson = '{}'".format(data))
