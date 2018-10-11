from flask import session

from proofvisualization.model import parsing as parser, positioning as positioner


def process_file():
    with open('example.proof') as proof_file:
        proof_dag = parser.process(proof_file.read())
        graph_layout = positioner.calculate_node_positions(proof_dag)

        # store in session
        session['dag'] = proof_dag
        session['positions'] = graph_layout
