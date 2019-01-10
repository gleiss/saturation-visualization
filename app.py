"""The application entry point"""

from flask import Flask, render_template, request, session
from flask_session import Session

from proof_visualization.controller import controller

app = Flask(__name__)
SESSION_TYPE = 'filesystem'
app.config.from_object(__name__)
Session(app)


@app.route("/", methods=['GET'])
def home():
    controller.init_controller()
    return render_template('main.html', dagData=controller.get_layout())


@app.route("/", methods=['POST'])
def handle_post_request():
    params = request.form.to_dict()

    if params.get('slide'):
        session['state'] = int(params['slide'])
    elif params.get('increase'):
        session['state'] += 1
    elif params.get('decrease'):
        session['state'] -= 1

    renderData = controller.get_layout()

    return render_template('main.html', dagData=renderData, slideState=session['state'])

if __name__ == '__main__':
    app.run()
