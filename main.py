"""The application entry point"""

import visualizer.controller.positioning as positioning

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def home():
    positioning.generate()
    return render_template('main.html')


if __name__ == '__main__':
    app.run()
