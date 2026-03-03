import os

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

#  Models
DEBATE_MODEL = "claude-sonnet-4-20250514"
JUDGE_MODEL = "claude-sonnet-4-20250514"  # can swap to haiku for cost savings
DEBATE_MAX_TOKENS = 1000
JUDGE_MAX_TOKENS = 300  # judge responses are short structured JSON

# TTS
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "elevenlabs")  # "elevenlabs" | "openai"
ELEVENLABS_MODEL = "eleven_multilingual_v2"

# Judge settings
SCORE_EVERY_N_ROUNDS = 1  # score every exchange
MOMENT_EVERY_N_ROUNDS = 1  # check for hot takes every exchange
CONVERGE_CHECK_START = 6  # don't check convergence until round 6
CONVERGE_CHECK_EVERY = 2  # check every 2 rounds after that
CONVERGE_CONFIDENCE_THRESHOLD = 7  # min confidence (1-10) to trigger convergence

# Debate settings
MAX_ROUNDS = 20  # hard ceiling on debate length
REPLAY_STORAGE_DIR = os.getenv("REPLAY_STORAGE_DIR", "./replays")

# Environment
FLASK_ENV = os.getenv("FLASK_ENV", "development")
IS_PRODUCTION = FLASK_ENV == "production"

# Replays (disabled in production to save storage)
SAVE_REPLAYS = not IS_PRODUCTION

# Rate limiting (production only)
RATE_LIMIT_ENABLED = IS_PRODUCTION
RATE_LIMIT_DEBATES_PER_DAY = 5  # max debates per user per day
RATE_LIMIT_TURNS_PER_DEBATE = 25  # ~25 turns per debate max
# Total turns allowed = 5 debates * 25 turns = 125 turns/day
RATE_LIMIT_TURNS_PER_DAY = RATE_LIMIT_DEBATES_PER_DAY * RATE_LIMIT_TURNS_PER_DEBATE
