"""The application entry point"""

from presenter.parsing import vampire_parser
from presenter import positioning

if __name__ == '__main__':
    with open('example.proof') as proof_file:
        proof = vampire_parser.parse(proof_file.read())
        positioning.position_nodes(proof)
