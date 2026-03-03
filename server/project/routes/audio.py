from flask import Blueprint, request, jsonify, send_file
from pydantic import ValidationError
import io

from ..models.schemas import SpeakRequest
from ..services import tts

audio_bp = Blueprint("audio", __name__, url_prefix="/api/audio")


@audio_bp.route("/speak", methods=["POST"])
def speak():
    """
    Convert text to audio. Returns the audio file as mp3 bytes.
    Client plays this directly via the Web Audio API or an <audio> element.

    Request:  { "text": "...", "voice_id": "..." }
    Response: audio/mpeg binary
    """
    try:
        body = SpeakRequest(**request.json)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    try:
        audio_bytes = tts.speak(body.text, body.voice_id)
    except Exception as e:
        return jsonify({"error": f"TTS failed: {str(e)}"}), 500

    return send_file(
        io.BytesIO(audio_bytes),
        mimetype="audio/mpeg",
        as_attachment=False,
        download_name="speech.mp3",
    )


@audio_bp.route("/clone", methods=["POST"])
def clone():
    """
    Clone a voice from an uploaded audio sample.
    Expects multipart/form-data with:
      - file: audio file (mp3, wav, m4a)
      - name: display name for the cloned voice

    Returns: { "voice_id": "..." }
    The voice_id can then be used in /api/audio/speak calls.
    """
    if "file" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["file"]
    name = request.form.get("name", "Custom Voice")

    # Validate file type
    allowed_types = {
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/m4a",
        "audio/mp4",
    }
    if audio_file.mimetype not in allowed_types:
        return (
            jsonify({"error": f"Unsupported audio format: {audio_file.mimetype}"}),
            400,
        )

    audio_bytes = audio_file.read()

    # Minimum sample length check (ElevenLabs needs at least ~30 seconds)
    MIN_BYTES = 50_000  # rough proxy for ~30s of audio
    if len(audio_bytes) < MIN_BYTES:
        return (
            jsonify(
                {"error": "Audio sample too short. Please record at least 30 seconds."}
            ),
            400,
        )

    try:
        voice_id = tts.clone_voice(name, audio_bytes)
    except Exception as e:
        return jsonify({"error": f"Voice cloning failed: {str(e)}"}), 500

    return jsonify({"voice_id": voice_id, "name": name})
