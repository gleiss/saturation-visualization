"""The application entry point."""

import json

from flask import Flask, request
from flask_cors import CORS

from model.parsing import process

app = Flask(__name__)
app.config.from_object(__name__)
CORS(app)


@app.route('/', methods=['POST'])
def handle_file_upload():
    request_params = request.get_json()
    text = request_params.get('file', '')
    dag = process(text)
    return json.dumps({'dag': dag.to_json()})


if __name__ == '__main__':
    app.run()
