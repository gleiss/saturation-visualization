"""The application entry point"""

from flask import Flask, render_template

import visualizer.controller.positioning as positioning

app = Flask(__name__)


@app.route("/")
def home():
    positioning.generate()
    return render_template('main.html')


if __name__ == '__main__':
    app.run()
