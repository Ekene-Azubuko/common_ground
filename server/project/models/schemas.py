from pydantic import BaseModel, field_validator
from typing import Literal


# Shared


class HistoryTurn(BaseModel):
    role: Literal["human", "ai", "system"]
    speaker: str
    text: str
    # Optional fields — not always present
    audio_url: str | None = None


# Debate routes


class DebateTurnRequest(BaseModel):
    mode: Literal["human", "ai_vs_ai"]
    topic: str
    # For human mode: one persona ID
    # For ai_vs_ai: two persona IDs
    persona_ids: list[str]
    history: list[HistoryTurn] = []
    # ai_vs_ai only: which agent speaks this turn ("a" | "b")
    speaker: Literal["a", "b"] | None = None
    # Ordered list of custom persona dicts — one per side [A, B].
    # Use null for any side that is a built-in persona.
    custom_personas: list[dict | None] | None = None

    @field_validator("persona_ids")
    @classmethod
    def check_persona_count(cls, v, info):
        mode = info.data.get("mode")
        if mode == "human" and len(v) != 1:
            raise ValueError("Human mode requires exactly 1 persona_id")
        if mode == "ai_vs_ai" and len(v) != 2:
            raise ValueError("AI vs AI mode requires exactly 2 persona_ids")
        return v

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Topic cannot be empty")
        return v.strip()


class SteerRequest(BaseModel):
    direction: str  # The moderator's instruction to inject
    history: list[HistoryTurn]

    @field_validator("direction")
    @classmethod
    def direction_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Steer direction cannot be empty")
        return v.strip()


# Judge routes


class JudgeScoreRequest(BaseModel):
    topic: str
    speaker_a_name: str
    speaker_b_name: str
    # The last two turns only (one from each side)
    last_exchange: list[HistoryTurn]


class JudgeConvergeRequest(BaseModel):
    topic: str
    speaker_a_name: str
    speaker_b_name: str
    history: list[HistoryTurn]
    round_num: int


# Audio routes


class SpeakRequest(BaseModel):
    text: str
    voice_id: str

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Text cannot be empty")
        if len(v) > 5000:
            raise ValueError("Text too long for TTS (max 5000 chars)")
        return v


# Replay routes


class SaveReplayRequest(BaseModel):
    topic: str
    mode: Literal["human", "ai_vs_ai"]
    personas: list[dict]
    history: list[HistoryTurn]
    scores: dict
    moments: list[dict]
    round_num: int
