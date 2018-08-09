"""The application entry point"""

import json
import re

from presenter.parsing import vampire_parser
from presenter import positioning


if __name__ == '__main__':
    with open('example.proof') as proof_file:
        proof = vampire_parser.parse(proof_file.read())

    positioning.position_nodes(proof)

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
                nodes.append({
                    'id': node.number,
                    'label': repr(node),
                    'x': int(float(x_coord) * -100),
                    'y': int(float(y_coord) * -1000),
                    'shape': 'box' if node.clause else 'ellipse',
                    'shapeProperties': {
                        'borderRadius': 0
                    },
                    'color': {
                        None: 'lightgray',
                        'theory axiom': 'red'
                    }.get(node.inference_rule, 'lightskyblue')
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

        with open('tree.js', 'w') as json_file:
            json_file.write("const data = {}".format(data))
