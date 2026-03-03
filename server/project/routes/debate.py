import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from flask import Blueprint, request, Response, jsonify, stream_with_context
from pydantic import ValidationError

from ..models.schemas import DebateTurnRequest, SteerRequest
from ..services import llm
from ..prompts import debate as debate_prompts
from ..prompts.personas import get_persona, PERSONAS
from .. import config

debate_bp = Blueprint("debate", __name__, url_prefix="/api/debate")

# In-memory rate limit storage (use Redis in production with multiple workers)
_rate_limit_storage = {}


def check_rate_limit():
    """
    Check rate limit for debate turns.
    Only applies limits in production. Returns error response if limit exceeded.
    """
    if not config.RATE_LIMIT_ENABLED:
        return None

    # Get client IP (check X-Forwarded-For for proxied requests)
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()  # First IP in chain

    now = datetime.now()
    today_key = now.strftime("%Y-%m-%d")
    storage_key = f"{client_ip}:{today_key}"

    # Clean old entries (from previous days)
    keys_to_delete = [k for k in _rate_limit_storage if not k.endswith(today_key)]
    for k in keys_to_delete:
        del _rate_limit_storage[k]

    # Check current count
    current_count = _rate_limit_storage.get(storage_key, 0)

    if current_count >= config.RATE_LIMIT_TURNS_PER_DAY:
        return (
            jsonify(
                {
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {config.RATE_LIMIT_DEBATES_PER_DAY} debates per day allowed. Try again tomorrow.",
                }
            ),
            429,
        )

    # Increment count
    _rate_limit_storage[storage_key] = current_count + 1

    return None


def _resolve_persona(persona_id: str, custom_persona: dict | None) -> dict | None:
    """
    Returns persona dict. Handles both built-in IDs and custom persona objects.
    Custom personas have IDs starting with "custom_".
    """
    # Any ID starting with "custom_" is a user-built persona
    if (persona_id.startswith("custom_") or persona_id == "custom") and custom_persona:
        name = custom_persona.get("name", "Custom Debater")
        style = custom_persona.get("style", "passionate and opinionated")
        background = custom_persona.get("background", "").strip()

        background_block = f"\nYour background: {background}" if background else ""

        def make_system(topic, _name=name, _style=style, _bg=background_block):
            return f"""You are {_name}, a custom debate persona.{_bg}

Your debate style: {_style}

Topic: {topic}

Rules:
- Argue your position with full conviction — never hedge or both-sides it
- Stay in character at all times, even under pressure
- Respond directly to your opponent's last point — no dodging
- 3-5 sentences per response. Be sharp, not verbose.
- Do not include stage directions or actions in asterisks (e.g. *leans forward*) — output only spoken words."""

        return {
            "name": name,
            "emoji": custom_persona.get("emoji", "🎭"),
            "el_voice_id": custom_persona.get("el_voice_id", "pNInz6obpgDQGcFmaJgB"),
            "oai_voice": custom_persona.get("oai_voice", "alloy"),
            "system": make_system,
        }

    return get_persona(persona_id)


# Streaming turn


@debate_bp.route("/turn", methods=["POST"])
def turn():
    """
    Main debate turn endpoint. Streams the AI response back as SSE.

    SSE format:
      data: {"chunk": "text fragment"}\n\n   — during generation
      data: [DONE]\n\n                        — when complete
      data: {"error": "message"}\n\n          — on error
    """
    # Rate limit check (production only)
    rate_error = check_rate_limit()
    if rate_error:
        return rate_error

    try:
        body = DebateTurnRequest(**request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    # Resolve personas
    if body.mode == "human":
        customs = body.custom_personas or []
        persona = _resolve_persona(
            body.persona_ids[0],
            customs[0] if customs else None,
        )
        if not persona:
            return jsonify({"error": f"Unknown persona: {body.persona_ids[0]}"}), 400

        history = [t.model_dump() for t in body.history]

        # First turn = opening statement, subsequent = response
        if not history or all(t["role"] == "system" for t in history):
            system, user_msg = debate_prompts.opening_statement(
                persona, body.topic, is_first=False
            )
        else:
            system, user_msg = debate_prompts.ai_vs_human_response(
                persona, body.topic, history
            )

    else:  # ai_vs_ai
        if not body.speaker:
            return (
                jsonify({"error": "speaker ('a' or 'b') required for ai_vs_ai mode"}),
                400,
            )

        idx = 0 if body.speaker == "a" else 1
        opp_idx = 1 - idx

        customs = body.custom_personas or []
        persona = _resolve_persona(
            body.persona_ids[idx],
            customs[idx] if idx < len(customs) else None,
        )
        opponent = _resolve_persona(
            body.persona_ids[opp_idx],
            customs[opp_idx] if opp_idx < len(customs) else None,
        )

        if not persona or not opponent:
            return jsonify({"error": "Invalid persona IDs"}), 400

        history = [t.model_dump() for t in body.history]

        # First turn ever = cold opening
        if not history or all(t["role"] == "system" for t in history):
            is_first = body.speaker == "a"
            system, user_msg = debate_prompts.opening_statement(
                persona, body.topic, is_first=is_first
            )
        else:
            system, user_msg = debate_prompts.ai_vs_ai_turn(
                persona, opponent, body.topic, history
            )

    def generate():
        try:
            for chunk in llm.stream_completion(system, user_msg):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # prevents nginx from buffering SSE
            "Connection": "keep-alive",
        },
    )


# ── Steer (moderator injection) ───────────────────────────────────────────────


@debate_bp.route("/steer", methods=["POST"])
def steer():
    """
    Inject a moderator direction into the debate history.
    Returns the system message to prepend to history on the client.
    The client adds this to history — both AI agents will see it on the next turn.
    """
    try:
        body = SteerRequest(**request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    system_msg = debate_prompts.steer_injection(body.direction)
    return jsonify({"system_message": system_msg})


# Personas list


@debate_bp.route("/personas", methods=["GET"])
def personas():
    """Returns all available persona configs (no system prompts — those stay server-side)."""
    from prompts.personas import get_all_personas

    return jsonify(get_all_personas())
