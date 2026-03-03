// Judge settings — mirror server/config.py
export const SCORE_EVERY_N           = 1;  // run judge score every N rounds
export const CONVERGE_CHECK_START    = 6;  // don't check convergence until round 6
export const CONVERGE_CHECK_EVERY    = 2;  // check every 2 rounds after that
export const CONVERGE_CONFIDENCE_MIN = 7;  // min confidence (1-10) to trigger convergence
export const MAX_ROUNDS              = 15; // hard ceiling on debate length