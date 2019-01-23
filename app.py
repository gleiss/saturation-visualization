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
    return render_template('main.html', dagData=controller.get_layout())


@app.route("/", methods=['POST'])
def handle_post_request():
    update_history_state(request.form.to_dict())
    return render_template('main.html', dagData=controller.get_layout(), historyState=session['history_state'])


@app.before_first_request
def clear_session():
    session.clear()


def update_history_state(request_params):
    upper_limit = len(session['positions']) - 1

    if request_params.get('slide'):
        session['history_state'] = request_params['slide']
    elif request_params.get('increase'):
        session['history_state'] = min(session['history_state'] + 1, upper_limit)
    elif request_params.get('decrease'):
        session['history_state'] = max(session['history_state'] - 1, 0)


if __name__ == '__main__':
    app.run()
