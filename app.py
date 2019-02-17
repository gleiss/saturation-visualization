"""The application entry point"""

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
    return render_template('main.html',
                           dagData=controller.get_layout(), historyLength=session['total_history_length'], reset=True,
                           legend=controller.get_legend())


@app.route("/", methods=['POST'])
def handle_post_request():
    params = request.form.to_dict()
    reset = False
    if params.get('file'):
        reset = True
        controller.init_dag(params['file'])
        refresh_history_state()
    elif params.get('selection'):
        reset = True
        controller.init_selection_dag(params['selection'].split(','))
        refresh_history_state()
    else:
        update_history_state(params)
    return render_template('main.html',
                           dagData=controller.get_layout(), historyState=session['history_state'],
                           historyLength=session['total_history_length'], reset=reset, legend=controller.get_legend())


@app.before_first_request
def clear_session():
    session.clear()


def update_history_state(request_params):
    upper_limit = session['total_history_length'] - 1

    if request_params.get('increase'):
        session['history_state'] = session['history_state'] + 1
    elif request_params.get('decrease'):
        session['history_state'] = session['history_state'] - 1
    elif request_params.get('slide'):
        session['history_state'] = int(request_params['slide'])

    if session['history_state'] < 0:
        session['history_state'] = 0
    elif 0 < upper_limit < session['history_state']:
        session['history_state'] = upper_limit


def refresh_history_state():
    session['history_state'] = max(session['total_history_length'], 0)


if __name__ == '__main__':
    app.run()
