import os
import json
import uuid
from datetime import datetime
from ..config import REPLAY_STORAGE_DIR


def _ensure_dir():
    os.makedirs(REPLAY_STORAGE_DIR, exist_ok=True)


def save_replay(debate: dict) -> str:
    """
    Persists a completed debate to disk.
    Returns the replay_id.
    """
    _ensure_dir()
    replay_id = str(uuid.uuid4())[:8]  # short 8-char ID for shareable URLs

    payload = {
        "id": replay_id,
        "saved_at": datetime.utcnow().isoformat(),
        "topic": debate.get("topic"),
        "mode": debate.get("mode"),
        "personas": debate.get("personas"),
        "history": debate.get("history"),
        "scores": debate.get("scores"),
        "moments": debate.get("moments"),
        "round_num": debate.get("round_num", 0),
    }

    path = os.path.join(REPLAY_STORAGE_DIR, f"{replay_id}.json")
    with open(path, "w") as f:
        json.dump(payload, f, indent=2)

    return replay_id


def load_replay(replay_id: str) -> dict | None:
    """
    Loads a saved debate by ID.
    Returns None if not found.
    """
    _ensure_dir()
    # Sanitize — only allow alphanumeric and hyphens to prevent path traversal
    safe_id = "".join(c for c in replay_id if c.isalnum() or c == "-")
    path = os.path.join(REPLAY_STORAGE_DIR, f"{safe_id}.json")

    if not os.path.exists(path):
        return None

    with open(path) as f:
        return json.load(f)


def list_replays(limit: int = 20) -> list[dict]:
    """
    Returns the most recent N replays (summary only, no full history).
    Useful for a 'recent debates' feed.
    """
    _ensure_dir()
    files = sorted(
        [f for f in os.listdir(REPLAY_STORAGE_DIR) if f.endswith(".json")],
        key=lambda f: os.path.getmtime(os.path.join(REPLAY_STORAGE_DIR, f)),
        reverse=True,
    )[:limit]

    summaries = []
    for fname in files:
        with open(os.path.join(REPLAY_STORAGE_DIR, fname)) as f:
            data = json.load(f)
            summaries.append(
                {
                    "id": data["id"],
                    "topic": data["topic"],
                    "mode": data["mode"],
                    "personas": data["personas"],
                    "saved_at": data["saved_at"],
                    "round_num": data.get("round_num", 0),
                }
            )

    return summaries
