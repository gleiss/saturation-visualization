"""The application entry point."""

import json
import os

from flask import Flask, session, request
from flask_cors import CORS
from flask_session import Session

from proof_visualization.controller import controller

VIEW_DIR = os.path.join(os.path.dirname(__file__), 'proof_visualization', 'view')
TEMPLATE_DIR = os.path.join(VIEW_DIR, 'templates')
STATIC_DIR = os.path.join(VIEW_DIR, 'static')

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)
SESSION_TYPE = 'filesystem'
SESSION_FILE_THRESHOLD = 1
app.config.from_object(__name__)
Session(app)
CORS(app)


@app.route("/", methods=['GET'])
def home():
    controller.init_controller()
    return json.dumps({
        'dag': session['dags'][0].to_json(),
        'history_state': session['history_state']
    })


@app.route("/", methods=['POST'])
def handle_post_request():
    request_params = request.get_json()

    if request_params.get('file'):
        controller.init_dag(request_params['file'])
    return json.dumps({
        'dag': session['dags'][0].to_json(),
        'history_state': 276
    })


@app.before_first_request
def clear_session():
    session.clear()


# HELPERS ##############################################################################################################

def _calculate_new_history_state(request_params):
    # update history state to new candidate value
    if request_params.get('increase'):
        history_state = session['history_state'] + 1
    elif request_params.get('decrease'):
        history_state = session['history_state'] - 1
    elif request_params.get('slide'):
        history_state = int(request_params['slide'])
    else:
        history_state = 0

    # make sure candidate is in meaningful interval and change if necessary
    history_state = max(0, history_state)

    last_step = session['dags'][0].last_step()
    history_state = min(history_state, last_step)

    session['history_state'] = history_state


def _get_default_values():
    return {
        'dag_data': controller.get_layout(),
        'history_state': session['history_state'],
        'history_length': session['dags'][0].number_of_history_steps(),
        'reset': False,
        'no_undo': len(session['dags']) == 1,
        'preselected_nodes': [],
        'marked_nodes': []
    }


def _as_list(selection_string):
    if not selection_string:
        return []
    return [int(node_id) for node_id in selection_string.split(',')]


# MAIN #################################################################################################################

if __name__ == '__main__':
    app.run()
