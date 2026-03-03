from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from ..models.schemas import JudgeScoreRequest, JudgeConvergeRequest
from ..services import llm
from ..prompts import judge as judge_prompts
from ..prompts.debate import build_transcript
from ..config import CONVERGE_CHECK_START, CONVERGE_CONFIDENCE_THRESHOLD

judge_bp = Blueprint("judge", __name__, url_prefix="/api/judge")


@judge_bp.route("/score", methods=["POST"])
def score():
    """
    Score the last exchange. Returns winner, shift amount, reason, and moment.
    Called after every exchange completes (non-blocking from client perspective).

    Response:
    {
        "winner": "Nietzsche" | "Gandhi" | "draw",
        "shift": 1-8,
        "reason": "one sentence",
        "moment": "verbatim best line",
        "is_moment": true | false
    }
    """
    try:
        body = JudgeScoreRequest(**request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    # Build the last exchange string from the last 2 turns
    exchange_turns = [t.model_dump() for t in body.last_exchange]
    last_exchange_text = build_transcript(exchange_turns)

    prompt = judge_prompts.score_exchange(
        topic=body.topic,
        speaker_a_name=body.speaker_a_name,
        speaker_b_name=body.speaker_b_name,
        last_exchange=last_exchange_text,
    )

    try:
        result = llm.complete_json(prompt, "Score this exchange.")
    except ValueError:
        # If Claude returns bad JSON, return a safe default — never crash
        return jsonify(
            {
                "winner": "draw",
                "shift": 1,
                "reason": "Exchange was evenly matched.",
                "moment": None,
                "is_moment": False,
            }
        )

    # Sanitize the result — clamp shift to valid range
    result["shift"] = max(1, min(8, int(result.get("shift", 1))))
    result["is_moment"] = bool(result.get("is_moment", False))

    # Only return a moment if is_moment is true and we have text
    if not result["is_moment"] or not result.get("moment"):
        result["moment"] = None
        result["is_moment"] = False

    return jsonify(result)


@judge_bp.route("/converge", methods=["POST"])
def converge():
    """
    Check whether an AI vs AI debate should start converging.
    Only meaningful after CONVERGE_CHECK_START rounds.

    Response:
    {
        "should_converge": true | false,
        "confidence": 1-10,
        "reason": "one sentence"
    }
    """
    try:
        body = JudgeConvergeRequest(**request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    # Hard gate — never converge before the minimum round
    if body.round_num < CONVERGE_CHECK_START:
        return jsonify(
            {
                "should_converge": False,
                "confidence": 0,
                "reason": f"Debate must reach round {CONVERGE_CHECK_START} before convergence.",
            }
        )

    # Build a concise summary of the full transcript for the judge
    history = [t.model_dump() for t in body.history]
    full_transcript = build_transcript(history)

    # Truncate if very long — judge only needs the arc, not every word
    MAX_SUMMARY_CHARS = 3000
    if len(full_transcript) > MAX_SUMMARY_CHARS:
        # Keep first 1000 chars (opening) + last 2000 chars (recent exchanges)
        transcript_summary = (
            full_transcript[:1000]
            + "\n...[middle of debate omitted]...\n"
            + full_transcript[-2000:]
        )
    else:
        transcript_summary = full_transcript

    prompt = judge_prompts.convergence_check(
        topic=body.topic,
        speaker_a_name=body.speaker_a_name,
        speaker_b_name=body.speaker_b_name,
        transcript_summary=transcript_summary,
        round_num=body.round_num,
    )

    try:
        result = llm.complete_json(prompt, "Should this debate converge?")
    except ValueError:
        return jsonify(
            {
                "should_converge": False,
                "confidence": 0,
                "reason": "Could not evaluate convergence.",
            }
        )

    # Enforce confidence threshold — even if judge says converge, confidence must be high
    confidence = int(result.get("confidence", 0))
    if confidence < CONVERGE_CONFIDENCE_THRESHOLD:
        result["should_converge"] = False

    result["confidence"] = confidence
    return jsonify(result)
