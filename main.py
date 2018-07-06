"""The application entry point"""

import vampire_parser

if __name__ == '__main__':
    with open('example.proof') as proof_file:
        proof = proof_file.read()
        print(vampire_parser.parse(proof))
