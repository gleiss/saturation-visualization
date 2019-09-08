"""The application entry point."""

import sys
if sys.version_info.major < 3:
    raise Exception("User error: This application only supports Python 3, so please use python3 instead of python!")

import json

from flask import Flask, request
from flask_cors import CORS

from model.parsing import parse
from model.vampire import VampireWrapper

app = Flask(__name__)
app.config.from_object(__name__)
CORS(app)

vampireWrapper = VampireWrapper()

@app.route('/', methods=['POST'])
def handle_file_upload():
    request_params = request.get_json()
    text = request_params.get('file', '')
    lines = parse(text)
    return json.dumps({'lines': [line.to_json() for line in lines]})

@app.route('/vampire/start', methods=['POST'])
def handle_startVampire():    
    request_params = request.get_json()
    inputFile = request_params.get('file', '')
    
    output = vampireWrapper.start(inputFile)
    lines = []
    for line in output.split("\n"):
        lines.append(line)
    return json.dumps({'output' : lines})

@app.route('/vampire/startmanualcs', methods=['POST'])
def handle_startVampireManualCS():
    request_params = request.get_json()
    inputFile = request_params.get('file', '')
    newLines = vampireWrapper.startManualCS(inputFile)
    return json.dumps({'vampireState' : vampireWrapper.vampireState, 'newLines' : newLines, 'remainingChoices' : vampireWrapper.remainingChoices})


@app.route('/vampire/select', methods=['POST'])
def handle_selection():    
    request_params = request.get_json()
    selectedId = int(request_params.get('id', ''))

    if(vampireWrapper.vampireState != "running"):
        print("Vampire is not running, so it makes no sense to perform selection!")
        return json.dumps({'vampireState' : vampireWrapper.vampireState, 'newLines' : None, 'remainingChoices' : None})
    if(not selectedId in vampireWrapper.remainingChoices):
        print("The remaining choices are: " + str(vampireWrapper.remainingChoices))
        print("Selected id " + str(selectedId) + " is not a valid choice and will be ignored!")
        return json.dumps({'vampireState' : vampireWrapper.vampireState, 'newLines' : None, 'remainingChoices' : vampireWrapper.remainingChoices})

    newLines = vampireWrapper.select(selectedId)
    return json.dumps({'vampireState' : vampireWrapper.vampireState, 'newLines' : newLines, 'remainingChoices' : vampireWrapper.remainingChoices})  

if __name__ == '__main__':
    app.run()
