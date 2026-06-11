from flask import Flask
from flask_cors import CORS

from routes.audio import audio_bp

app = Flask(__name__)

CORS(app)

app.register_blueprint(audio_bp)

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )