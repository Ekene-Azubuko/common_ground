from flask import Flask, jsonify
from flask_cors import CORS

from .routes.debate import debate_bp
from .routes.judge import judge_bp
from .routes.audio import audio_bp
from .routes.replay import replay_bp


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register all blueprints
    app.register_blueprint(debate_bp)
    app.register_blueprint(judge_bp)
    app.register_blueprint(audio_bp)
    app.register_blueprint(replay_bp)

    # Health check
    @app.route("/health")
    def health():
        return jsonify({"message": "App is running"})

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_err(e):
        return jsonify({"error": "Internal server error"}), 500

    return app
