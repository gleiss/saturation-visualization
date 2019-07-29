"""The application entry point."""

import json

from flask import Flask, request
from flask_cors import CORS

from visualization_backend.model.parsing import process

app = Flask(__name__)
app.config.from_object(__name__)
CORS(app)


@app.route('/', methods=['GET'])
def home():
    dag = init_with_example()
    return json.dumps({'dag': dag.to_json()})


@app.route('/', methods=['POST'])
def handle_file_upload():
    request_params = request.get_json()
    text = request_params.get('file', '')
    dag = to_dag(text)
    return json.dumps({'dag': dag.to_json()})


def init_with_example():
    with open('example.proof') as proof_file:
        file_content = proof_file.read()
        return to_dag(file_content)


def to_dag(file_content):
    return process(file_content)


if __name__ == '__main__':
    app.run()
