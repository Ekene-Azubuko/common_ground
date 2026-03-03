#!/bin/bash
# curl -X POST \
#   http://127.0.0.1:5000/api/debate/turn \
#   -H "Content-Type: application/json" \
#   -d '{
#     "mode": "ai_vs_ai",
#     "topic": "iPhone vs android, what should be your first phone",
#     "persona_ids": ["trump", "socrates"],
#     "history": [],
#     "speaker": "b",
#     "custom_persona": null
#   }'

curl -X POST http://127.0.0.1:5000/api/audio/speak \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I think your entire argument premise is false because it assumes a single cause where multiple interacting factors are clearly at play. By reducing the issue to one simplified explanation, you overlook important contextual variables that significantly influence the outcome. Your conclusion depends heavily on that narrow framing, which weakens the logical structure of your reasoning. Additionally, several counterexamples directly challenge the universality of your claim. Until those complexities are addressed, the argument remains incomplete and unconvincing.", 
    "voice_id": "nPczCjzI2devNBz1zQrb"}' \
  --output test_audio.mp3

