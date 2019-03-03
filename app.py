"""The application entry point."""

import os

from flask import Flask, render_template, request, session
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


@app.route("/", methods=['GET'])
def home():
    controller.init_controller()
    template_values = _get_default_values()
    template_values.update({
        'reset': True,
        'no_undo': True
    })
    return render_template('main.html', **template_values)


@app.route("/", methods=['POST'])
def handle_post_request():
    request_params = request.form.to_dict()

    if request_params.get('file'):
        controller.init_dag(request_params['file'])
        controller.refresh_history_state()
        custom_template_values = {
            'reset': True
        }

    elif request_params.get('selection'):
        selection = _as_list(request_params['selection'])

        if request_params.get('up'):
            controller.filter_non_parents(selection)
        else:
            controller.filter_non_consequences(selection)
        controller.refresh_history_state()
        custom_template_values = {
            'reset': True,
            'preselected_nodes': selection,
            'marked_nodes': _as_list(request_params['marked'])
        }

    elif request_params.get('undo'):
        controller.reset_dag()
        controller.refresh_history_state()
        custom_template_values = {
            'reset': True,
            'preselected_nodes': _as_list(request_params['resetSelection']),
            'marked_nodes': _as_list(request_params['marked'])
        }

    elif request_params.get('consequenceSelection'):
        custom_template_values = {
            'preselected_nodes': controller.find_common_consequences(_as_list(request_params['consequenceSelection'])),
            'marked_nodes': _as_list(request_params['marked'])
        }

    else:
        _calculate_new_history_state(request_params)
        custom_template_values = {
            'preselected_nodes': _as_list(request_params.get('historySelection')),
            'marked_nodes': _as_list(request_params.get('marked'))
        }

    template_values = _get_default_values()
    template_values.update(custom_template_values)
    return render_template('main.html', **template_values)


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
