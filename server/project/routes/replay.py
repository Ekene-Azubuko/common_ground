from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from ..models.schemas import SaveReplayRequest
from ..services import storage
from .. import config

replay_bp = Blueprint("replay", __name__, url_prefix="/api/replay")


@replay_bp.route("/save", methods=["POST"])
def save():
    """
    Persist a completed debate.
    Returns: { "replay_id": "abc12345", "url": "/replay/abc12345" }
    In production, replays are not saved (returns empty replay_id).
    """
    # Skip saving in production
    if not config.SAVE_REPLAYS:
        return jsonify({"replay_id": None, "url": None})

    try:
        body = SaveReplayRequest(**request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    replay_id = storage.save_replay(body.model_dump())
    return jsonify(
        {
            "replay_id": replay_id,
            "url": f"/replay/{replay_id}",
        }
    )


@replay_bp.route("/<replay_id>", methods=["GET"])
def load(replay_id: str):
    """
    Load a saved debate by ID.
    Returns the full debate object or 404.
    """
    data = storage.load_replay(replay_id)
    if not data:
        return jsonify({"error": "Replay not found"}), 404
    return jsonify(data)


@replay_bp.route("/list", methods=["GET"])
def list_replays():
    """
    Returns the 20 most recent debates (summaries only).
    Useful for a 'recent debates' or 'trending' feed.
    """
    limit = min(int(request.args.get("limit", 20)), 50)
    replays = storage.list_replays(limit=limit)
    return jsonify(replays)
