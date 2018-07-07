"""The application entry point"""

import vampire_parser

if __name__ == '__main__':
    with open('example.proof') as proof_file:
        proof_nodes = vampire_parser.parse(proof_file.read())
        print(proof_nodes)
