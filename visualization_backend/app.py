"""The application entry point."""

import sys
if sys.version_info.major < 3:
    raise Exception("User error: This application only supports Python 3, so please use python3 instead of python!")

import json

from flask import Flask, request
from flask_cors import CORS

from model.parsing import parse
from model.vampire import VampireWrapper

import tempfile

app = Flask(__name__)
app.config.from_object(__name__)
CORS(app)

vampireWrapper = VampireWrapper()

@app.route('/vampire/start', methods=['POST'])
def handle_startVampire():  
    # TODO: proper exception handling for all POST requests  
    request_params = request.get_json()
    fileContent = request_params.get('file', '')
    inputSyntax = request_params.get('inputSyntax', '')
    
    temporaryFile = tempfile.NamedTemporaryFile()
    temporaryFile.write(str.encode(fileContent))
    temporaryFile.flush() # commit file buffer to disk so that Vampire can access it
    output = vampireWrapper.start(temporaryFile.name, inputSyntax)
    lines = parse(output)
    temporaryFile.close()

    return json.dumps({'vampireState' : vampireWrapper.vampireState, 'lines' : [line.to_json() for line in lines]})

@app.route('/vampire/startmanualcs', methods=['POST'])
def handle_startVampireManualCS():
    request_params = request.get_json()
    fileContent = request_params.get('file', '')
    inputSyntax = request_params.get('inputSyntax', '')

    temporaryFile = tempfile.NamedTemporaryFile()
    temporaryFile.write(str.encode(fileContent))
    temporaryFile.flush() # commit file buffer to disk so that Vampire can access it
    output = vampireWrapper.startManualCS(temporaryFile.name, inputSyntax)
    lines = parse(output)
    temporaryFile.close()

    return json.dumps({'vampireState' : vampireWrapper.vampireState, 'lines' : [line.to_json() for line in lines], 'remainingChoices' : vampireWrapper.remainingChoices})


@app.route('/vampire/select', methods=['POST'])
def handle_selection():    
    request_params = request.get_json()
    selectedId = int(request_params.get('id', ''))

    if(vampireWrapper.vampireState != "running"):
        print("Vampire is not running, so it makes no sense to perform selection!")
        return json.dumps({'vampireState' : vampireWrapper.vampireState, 'lines' : None, 'remainingChoices' : None})
    if(not selectedId in vampireWrapper.remainingChoices):
        print("The remaining choices are: " + str(vampireWrapper.remainingChoices))
        print("Selected id " + str(selectedId) + " is not a valid choice and will be ignored!")
        return json.dumps({'vampireState' : vampireWrapper.vampireState, 'lines' : None, 'remainingChoices' : vampireWrapper.remainingChoices})

    output = vampireWrapper.select(selectedId)
    lines = parse(output)

    return json.dumps({'vampireState' : vampireWrapper.vampireState, 'lines' : [line.to_json() for line in lines], 'remainingChoices' : vampireWrapper.remainingChoices})  

if __name__ == '__main__':
    app.run()
