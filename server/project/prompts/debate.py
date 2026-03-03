def build_transcript(history: list[dict]) -> str:
    """Converts history array to readable string for prompt injection."""
    lines = []
    for turn in history:
        if turn.get("role") == "system":
            continue
        lines.append(f"[{turn['speaker']}]: {turn['text']}")
    return "\n".join(lines) if lines else "(debate just started)"


def ai_vs_human_response(
    persona: dict, topic: str, history: list[dict]
) -> tuple[str, str]:
    """
    Returns (system_prompt, user_message) for AI responding to a human argument.
    The user_message is the last human turn.
    """
    transcript = build_transcript(history)
    last_human = next(
        (t["text"] for t in reversed(history) if t.get("role") == "human"),
        "Begin the debate.",
    )

    system = f"""{persona['system'](topic)}

Full debate transcript so far:
{transcript}

Instructions:
- Respond directly to your opponent's last point
- Stay in character at all times
- If they reference something you said earlier, address it head on — don't dodge
- Do not break character or acknowledge you are an AI
- Do not include stage directions or actions in asterisks (e.g. *leans forward*) — output only spoken words"""

    return system, last_human


def ai_vs_ai_turn(
    speaker_persona: dict, opponent_persona: dict, topic: str, history: list[dict]
) -> tuple[str, str]:
    """
    Returns (system_prompt, user_message) for one AI agent's turn against another.
    """
    transcript = build_transcript(history)
    last_opponent = next(
        (
            t["text"]
            for t in reversed(history)
            if t.get("speaker") == opponent_persona["name"]
        ),
        "Begin your opening argument.",
    )

    system = f"""{speaker_persona['system'](topic)}

You are debating {opponent_persona['name']}.
Full transcript so far:
{transcript}

Instructions:
- Respond directly to {opponent_persona['name']}'s last point
- Stay fully in character — never break
- Reference prior exchanges when relevant ("You claimed earlier that...")
- Do not simply repeat your previous arguments — build or escalate
- Do not include stage directions or actions in asterisks (e.g. *gestures*) — output only spoken words"""

    return system, f"Respond to: {last_opponent}"


def opening_statement(persona: dict, topic: str, is_first: bool) -> tuple[str, str]:
    """
    First turn of the debate. If is_first=True this persona opens cold.
    If is_first=False, they respond to the opener.
    """
    system = f"""{persona['system'](topic)}

This is your opening statement. Make it count.
Be provocative — give your opponent something to push back on.
Do not hedge or give both sides. Take a clear, strong position immediately.
Do not include stage directions or actions in asterisks (e.g. *stands*) — output only spoken words."""

    user = (
        "Give your opening statement on this topic."
        if is_first
        else "Respond to your opponent's opening with your own opening position."
    )

    return system, user


def steer_injection(direction: str) -> dict:
    """
    Creates a system message injected into history when the user steers the debate.
    Both AI agents will see this in the transcript and naturally pivot.
    """
    return {
        "role": "system",
        "speaker": "MODERATOR",
        "text": f"[MODERATOR INTERVENTION]: {direction}",
    }
