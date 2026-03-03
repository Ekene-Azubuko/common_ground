import io
from ..config import (
    ELEVENLABS_API_KEY,
    OPENAI_API_KEY,
    TTS_PROVIDER,
    ELEVENLABS_MODEL,
)


def speak(text: str, voice_id: str) -> bytes:
    """
    Convert text to audio bytes.
    voice_id is either an ElevenLabs voice ID or an OpenAI voice name
    depending on TTS_PROVIDER.
    """
    if TTS_PROVIDER == "elevenlabs":
        return _elevenlabs_speak(text, voice_id)
    return _openai_speak(text, voice_id)


def _elevenlabs_speak(text: str, voice_id: str) -> bytes:
    from elevenlabs.client import ElevenLabs

    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

    audio_generator = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        output_format="mp3_44100_128",
        model_id=ELEVENLABS_MODEL,
    )
    # ElevenLabs returns a generator of bytes chunks — join them
    return b"".join(audio_generator)


def _openai_speak(text: str, voice_id: str) -> bytes:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.audio.speech.create(
        model="tts-1",
        voice=voice_id,  # alloy | echo | fable | onyx | nova | shimmer
        input=text,
    )
    return response.content


def clone_voice(name: str, audio_bytes: bytes) -> str:
    """
    Clone a voice from an audio sample using ElevenLabs instant voice cloning.
    Returns a voice_id that can be used in future speak() calls.
    Always uses ElevenLabs regardless of TTS_PROVIDER setting.
    """
    from elevenlabs.client import ElevenLabs

    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

    voice = client.clone(
        name=name,
        description="User cloned voice for debate app",
        files=[("voice_sample.mp3", audio_bytes, "audio/mpeg")],
    )
    return voice.voice_id


def get_voice_id(persona: dict) -> str:
    """
    Returns the right voice ID for the current TTS provider.
    """
    if TTS_PROVIDER == "elevenlabs":
        return persona.get("el_voice_id", "")
    return persona.get("oai_voice", "alloy")
