"""The application entry point"""

from flask import Flask, render_template, request
from flask_session import Session

from proof_visualization.controller import controller

app = Flask(__name__)
SESSION_TYPE = 'filesystem'
app.config.from_object(__name__)
Session(app)


@app.route("/", methods=['GET'])
def home():
    return render_template('main.html', dagData=controller.get_layout())


@app.route("/", methods=['POST'])
def render_history():
    params = request.form.to_dict()
    state = params.get('slide')
    return render_template('main.html', dagData=controller.get_layout(state), slideState=state)


if __name__ == '__main__':
    app.run()
