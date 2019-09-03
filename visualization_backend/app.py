"""The application entry point."""

import json

from flask import Flask, request
from flask_cors import CORS

from model.parsing import process

from subprocess import PIPE, Popen
# import random

app = Flask(__name__)
app.config.from_object(__name__)
CORS(app)

vampireProcess = None # Process | None
vampireState = None # "running" | "saturation" | "refutation" | "error" | None
remainingChoices = None # [clauseIdsToBeActivatedInTheFuture] | None

def collectVampireOutput(vampireProcess):
    # process lines until a line occurs with either is 1) a commando to enter a number 2) refutation found 3) saturation reached 4) user error
    newLines = []
    line = vampireProcess.stdout.readline().decode().rstrip()
    while(True):
        if line.startswith("Pick a clause from:"):
            remainingChoices = list(map(lambda id: int(id), line[20:-1].split(","))) # remove "Pick a clause from: " and last comma, then split by commas, then convert to ints
            return newLines, "running", remainingChoices
        elif line.startswith("% Refutation found. Thanks to"): # TODO: use SZS status instead?
            return newLines, "refutation", None
        elif line.startswith("% SZS status Satisfiable"):
            return newLines, "saturation", []
        elif line.startswith("User error: "):
            return newLines, "error", []
        else:
            newLines.append(line)
            line = vampireProcess.stdout.readline().decode().rstrip()

def startVampire(vampireProcess, inputFile):
    if vampireProcess != None:
        vampireProcess.kill()
    vampireProcess = Popen(["/Users/bernhard/repos/vampire-release/vampire_rel_manualcl_4057", "--input_syntax", "smtlib2", "-av", "off", inputFile, "--manual_cs", "on", "--show_passive", "on"], stdin=PIPE, stdout=PIPE)
    
    newLines, vampireState, remainingChoices = collectVampireOutput(vampireProcess)
    return vampireProcess, newLines, vampireState, remainingChoices

def doOneStep(vampireProcess, selectedId):
    vampireProcess.stdin.write(str.encode(str(selectedId) + "\n"))
    vampireProcess.stdin.flush()

    newLines, vampireState, remainingChoices = collectVampireOutput(vampireProcess)
    return newLines, vampireState, remainingChoices

@app.route('/', methods=['POST'])
def handle_file_upload():
    request_params = request.get_json()
    text = request_params.get('file', '')
    dag = process(text)
    return json.dumps({'dag': dag.to_json()})


@app.route('/startVampire', methods=['POST'])
def handle_startVampire():
    global vampireProcess
    global vampireState
    global remainingChoices

    request_params = request.get_json()
    inputFile = request_params.get('file', '')
    vampireProcess, newLines, vampireState, remainingChoices = startVampire(vampireProcess, inputFile) # "/Users/bernhard/Desktop/test.smt2"
    return json.dumps({'vampireState' : vampireState, 'newLines' : newLines, 'remainingChoices' : remainingChoices})


@app.route('/selection', methods=['POST'])
def handle_selection():
    global vampireState
    global remainingChoices
    
    request_params = request.get_json()
    selectedId = int(request_params.get('id', ''))

    if(vampireState != "running"):
        print("Vampire is not running, so it makes no sense to perform selection!")
        return json.dumps({'vampireState' : vampireState, 'newLines' : None, 'remainingChoices' : None})
    if(not selectedId in remainingChoices):
        print(remainingChoices)
        print("Selected id " + str(selectedId) + " is not a valid choice and will be ignored!")
        return json.dumps({'vampireState' : vampireState, 'newLines' : None, 'remainingChoices' : remainingChoices})

    newLines, vampireState, remainingChoices = doOneStep(vampireProcess, selectedId)
    return json.dumps({'vampireState' : vampireState, 'newLines' : newLines, 'remainingChoices' : remainingChoices})





if __name__ == '__main__':
    app.run()
