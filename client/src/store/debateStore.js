import { create } from "zustand";

export const PHASES = {
  IDLE:        "idle",
  SETUP:       "setup",
  INTRO:       "intro",
  HUMAN_TURN:  "human_turn",
  AI_THINKING: "ai_thinking",
  AI_SPEAKING: "ai_speaking",
  PAUSED:      "paused",
  CONVERGING:  "converging",
  ENDED:       "ended",
};

const initialState = {
  phase:      PHASES.IDLE,
  mode:       null,        // "human" | "ai_vs_ai"
  topic:      null,
  personas:   [],          // resolved persona objects from server
  history:    [],          // { role, speaker, text, audioUrl? }
  roundNum:   0,
  scores:     { a: 50, b: 50 },
  moments:    [],          // { text, speaker, round }
  replayId:   null,
  streamingText: "",       // live text being streamed for current turn
  activeSpeaker: null,     // "a" | "b" | "human" — whose turn it is
  loopStarted: false,      // guard against duplicate loop starts (StrictMode)
  pausePending: false,     // true when pause clicked, waiting for current stream to finish
  error:      null,        // { type, message } for displaying errors to user
};

export const useDebateStore = create((set, get) => ({
  ...initialState,

  //  Setters 
  setPhase:        (phase)        => set({ phase }),
  setStreamingText: (text)        => set({ streamingText: text }),
  setActiveSpeaker: (speaker)     => set({ activeSpeaker: speaker }),
  setLoopStarted:  (started)      => set({ loopStarted: started }),
  setPausePending: (pending)      => set({ pausePending: pending }),
  setError:        (error)        => set({ error }),
  clearError:      ()             => set({ error: null }),

  initDebate: ({ mode, topic, personas }) =>
    set({ ...initialState, phase: PHASES.INTRO, mode, topic, personas, loopStarted: false }),

  //  History 
  addTurn: (turn) =>
    set((s) => ({
      history:   [...s.history, turn],
      roundNum:  s.roundNum + 1,
      streamingText: "",
    })),

  addSystemMessage: (text) =>
    set((s) => ({
      history: [...s.history, { role: "system", speaker: "MODERATOR", text }],
    })),

  //  Scores 
  updateScores: (winner, shift) =>
    set((s) => {
      const { a, b } = s.scores;
      const personaA = s.personas[0]?.name;
      if (winner === personaA) {
        return { scores: { a: Math.min(95, a + shift), b: Math.max(5, b - shift) } };
      } else if (winner !== "draw") {
        return { scores: { a: Math.max(5, a - shift), b: Math.min(95, b + shift) } };
      }
      return {};
    }),

  //  Moments 
  addMoment: (moment) =>
    set((s) => ({ moments: [...s.moments, moment] })),

  // Replay 
  setReplayId: (id) => set({ replayId: id }),

  reset: () => set(initialState),
}));