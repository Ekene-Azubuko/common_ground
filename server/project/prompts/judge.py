def score_exchange(
    topic: str,
    speaker_a_name: str,
    speaker_b_name: str,
    last_exchange: str,
) -> str:
    return f"""You are a neutral debate judge. Evaluate this single exchange only — not the overall debate.

Topic: {topic}
Debaters: {speaker_a_name} vs {speaker_b_name}

Last exchange:
{last_exchange}

Scoring criteria:
- Did they directly address the opponent's point or dodge it?
- Was the argument logically sound or full of fallacies?
- Did they introduce new substance or just repeat themselves?
- Did they expose a genuine weakness in the opponent's position?
- Did they land a memorable or cutting line?

Return ONLY valid JSON, no markdown, no extra text:
{{
  "winner": "{speaker_a_name}" | "{speaker_b_name}" | "draw",
  "shift": <integer 1-8>,
  "reason": "<one sentence, max 12 words>",
  "moment": "<the single sharpest line from this exchange, copied verbatim>",
  "is_moment": true | false
}}

shift = points to move the meter toward the winner
  1-2 = slight edge
  3-4 = clear win
  5-6 = strong win
  7-8 = devastating, opponent had no answer

is_moment = true only if one line was genuinely witty, historically sharp, or cutting enough to screenshot"""


def convergence_check(
    topic: str,
    speaker_a_name: str,
    speaker_b_name: str,
    transcript_summary: str,
    round_num: int,
) -> str:
    return f"""You are watching a debate between {speaker_a_name} and {speaker_b_name} on: {topic}
Current round: {round_num}

Summary of the debate so far:
{transcript_summary}

Has this debate reached a natural conclusion point where both sides should begin finding common ground?

Consider:
- Have the core disagreements been fully and clearly aired?
- Are arguments starting to repeat without new substance?
- Has either side made a meaningful concession or acknowledgment?
- Would continuing feel like diminishing returns?

Return ONLY valid JSON, no markdown:
{{
  "should_converge": true | false,
  "confidence": <integer 1-10>,
  "reason": "<one sentence explaining why>"
}}

Only return should_converge: true if you are genuinely confident the debate has run its course.
confidence below 7 should always pair with should_converge: false."""


def convergence_turn(
    persona: dict,
    opponent_name: str,
    topic: str,
    transcript: str,
) -> tuple[str, str]:
    """
    Replaces the normal debate prompt when convergence begins.
    The agent starts genuinely finding common ground.
    """
    system = f"""{persona['system'](topic)}

The debate has reached its natural conclusion. It is time to find genuine common ground.

You have made your strongest arguments. Now:
- Without abandoning your core principles, identify 1-2 things you and {opponent_name} actually agree on
- Acknowledge what {opponent_name} got right — be authentic, not performative
- Propose a synthesis, a nuance, or a shared understanding you can both stand behind
- This should feel earned, not forced — a real intellectual concession

Full transcript:
{transcript}"""

    return (
        system,
        f"Find genuine common ground with {opponent_name} to conclude the debate.",
    )
