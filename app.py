"""The application entry point"""

import os

from flask import Flask, render_template, request, session
from flask_session import Session

from proof_visualization.controller import controller
from proof_visualization.model.search import find_common_consequences

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
    template_values = get_default_values()
    template_values['reset'] = True
    template_values['no_undo'] = True
    return render_template('main.html', **template_values)


@app.route("/", methods=['POST'])
def handle_post_request():
    params = request.form.to_dict()
    template_values = get_default_values()

    if params.get('file'):
        controller.init_dag(params['file'])
        refresh_history_state()
        template_values['reset'] = True
        template_values['no_undo'] = True

    elif params.get('selection'):
        selection = [int(param) for param in params['selection'].split(',')]

        if params.get('up'):
            controller.filter_non_parents(selection)
        else:
            controller.filter_non_consequences(selection)
        refresh_history_state()
        template_values['reset'] = True
        template_values['preselected_nodes'] = selection

    elif params.get('undo'):
        controller.reset_dag()
        refresh_history_state()
        template_values['reset'] = True
        template_values['no_undo'] = len(session['dags']) == 1
        template_values['preselected_nodes'] = params.get('selection', [])

    elif params.get('consequences'):
        node_ids = {int(id_) for id_ in params['consequences'].split(',')}
        template_values['preselected_nodes'] = find_common_consequences(session['dags'][-1], node_ids)

    else:
        update_history_state(params)
    return render_template('main.html', **template_values)


@app.before_first_request
def clear_session():
    session.clear()


def update_history_state(request_params):
    # update history state to new canidate value
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


def refresh_history_state():
    session['history_state'] = session['dags'][0].last_step()


def get_default_values():
    return {
        'dag_data': controller.get_layout(),
        'history_state': session['history_state'],
        'history_length': session['dags'][0].number_of_history_steps(),
        'reset': False,
        'no_undo': False,
        'preselected_nodes': []
    }


if __name__ == '__main__':
    app.run()
