import json
from anthropic import Anthropic
from ..config import (
    ANTHROPIC_API_KEY,
    DEBATE_MODEL,
    JUDGE_MODEL,
    DEBATE_MAX_TOKENS,
    JUDGE_MAX_TOKENS,
)

client = Anthropic(api_key=ANTHROPIC_API_KEY)


def complete(
    system: str,
    user: str,
    model: str = DEBATE_MODEL,
    max_tokens: int = DEBATE_MAX_TOKENS,
) -> str:
    """Standard blocking completion. Returns full text string."""
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return response.content[0].text


def complete_json(system: str, user: str) -> dict:
    """
    For judge calls that must return structured JSON.
    Uses haiku-class model for speed + cost, strips markdown fences, parses.
    Raises ValueError if Claude returns unparseable JSON.
    """
    raw = complete(system, user, model=JUDGE_MODEL, max_tokens=JUDGE_MAX_TOKENS)
    clean = raw.strip()

    # Strip markdown code fences if present
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    try:
        return json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"Judge returned invalid JSON: {raw!r}") from e


def stream_completion(system: str, user: str):
    """
    Generator that yields text chunks for SSE streaming.
    Usage: for chunk in stream_completion(system, user): yield chunk
    """
    with client.messages.stream(
        model=DEBATE_MODEL,
        max_tokens=DEBATE_MAX_TOKENS,
        system=system,
        messages=[{"role": "user", "content": user}],
    ) as stream:
        for text_chunk in stream.text_stream:
            yield text_chunk
