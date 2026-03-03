import { useRef, useCallback } from "react";
import { useDebateStore, PHASES } from "../store/debateStore";
import {
  streamDebateTurn,
  judgeScore,
  judgeConverge,
  steerDebate,
  saveReplay,
} from "../lib/api";
import { CONVERGE_CHECK_START, CONVERGE_CHECK_EVERY, SCORE_EVERY_N } from "../lib/config";

// Throttle streaming UI updates so text is readable and doesn't jitter
const MIN_STREAM_MS = 120;

export function useDebate() {
  const store = useDebateStore();
  const abortRef = useRef(false);
  const pauseRequestedRef = useRef(false);  // signals "pause after current turn finishes"
  const loopRunningRef = useRef(false);      // tracks if runAiVsAi loop is currently executing

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── Judge (background, non-blocking) ──────────────────────────────────────

  const runJudgeScore = async (history, roundNum) => {
    if (roundNum % SCORE_EVERY_N !== 0) return;
    if (store.personas.length < 2) return;
    const lastTwo = history.slice(-2);
    if (lastTwo.length < 2) return;
    try {
      const result = await judgeScore({
        topic: store.topic,
        speakerAName: store.personas[0].name,
        speakerBName: store.personas[1].name,
        lastExchange: lastTwo,
      });
      if (result.winner && result.shift) store.updateScores(result.winner, result.shift);
      if (result.is_moment && result.moment) {
        store.addMoment({ text: result.moment, speaker: result.winner, round: roundNum });
      }
    } catch (err) {
      console.warn("Judge scoring failed (non-fatal):", err);
    }
  };

  const runConvergeCheck = async (history, roundNum) => {
    if (roundNum < CONVERGE_CHECK_START) return false;
    if ((roundNum - CONVERGE_CHECK_START) % CONVERGE_CHECK_EVERY !== 0) return false;
    try {
      const result = await judgeConverge({
        topic: store.topic,
        speakerAName: store.personas[0].name,
        speakerBName: store.personas[1].name,
        history,
        roundNum,
      });
      return result.should_converge === true;
    } catch {
      return false;
    }
  };

  // ── Core turn ─────────────────────────────────────────────────────────────

  const speakTurn = useCallback(async ({ speakerKey, personaIds, history }) => {
    if (abortRef.current) return null;

    const speakerIdx = speakerKey === "a" ? 0 : 1;
    const persona = store.personas[speakerIdx];
    if (!persona) return null;

    store.setPhase(PHASES.AI_SPEAKING);
    store.setActiveSpeaker(speakerKey);
    store.setStreamingText("");

    // Stream chunks live from Flask — throttle updates for smooth, readable pace
    let fullText = "";
    let lastUpdate = 0;
    let pendingText = "";
    let updateTimer = null;

    const scheduleUpdate = (text) => {
      pendingText = text;
      if (updateTimer) return;
      const now = Date.now();
      const delay = Math.max(0, MIN_STREAM_MS - (now - lastUpdate));
      updateTimer = setTimeout(() => {
        updateTimer = null;
        lastUpdate = Date.now();
        if (!abortRef.current) store.setStreamingText(pendingText);
      }, delay);
    };

    try {
      const customPersonas = store.personas.map((p) => p.isCustom ? p : null);
      const hasAnyCustom = customPersonas.some(Boolean);

      fullText = await streamDebateTurn(
        {
          mode: store.mode,
          topic: store.topic,
          personaIds,
          history,
          speaker: speakerKey,
          customPersonas: hasAnyCustom ? customPersonas : null,
        },
        (text) => {
          if (!abortRef.current) scheduleUpdate(text);
        }
      );
    } catch (err) {
      if (!abortRef.current) {
        console.error("Stream failed:", err);
        // Handle rate limit error specifically
        if (err.isRateLimit) {
          store.setError({
            type: "rate_limit",
            message: err.message || "Daily debate limit reached. Try again tomorrow.",
          });
          store.setPhase(PHASES.ENDED);
          loopRunningRef.current = false;
        }
      }
      return null;
    }

    if (updateTimer) {
      clearTimeout(updateTimer);
      updateTimer = null;
    }
    if (!abortRef.current && pendingText) store.setStreamingText(pendingText);

    if (abortRef.current || !fullText) return null;

    // AUDIO PLACEHOLDER — uncomment when voice IDs are confirmed
    // const voiceId = persona.el_voice_id ?? persona.oai_voice ?? "";
    // await new Promise((resolve) => {
    //   audio.enqueue(fullText, voiceId,
    //     (partial) => store.setStreamingText(partial),
    //     resolve
    //   );
    // });

    // Pause so the reader can finish the last sentence before it locks in
    await sleep(900);

    // Commit to history
    const turn = { role: "ai", speaker: persona.name, text: fullText };
    store.addTurn(turn);
    store.setStreamingText("");

    return { turn, fullText };
  }, [store]);

  // ── AI vs AI loop ─────────────────────────────────────────────────────────

  const runAiVsAi = useCallback(async () => {    // Guard against concurrent loops
    if (loopRunningRef.current) {
      console.warn("runAiVsAi: loop already running, skipping");
      return;
    }
    loopRunningRef.current = true;
    abortRef.current = false;
    const { personas, mode, history: storeHistory, roundNum: storeRound } = useDebateStore.getState();
    const personaIds = personas.map((p) => p.id);

    // Resume from store state if we have history, otherwise fresh start
    let history = storeHistory.length > 0 ? [...storeHistory] : [];
    let round = storeHistory.length > 0 ? storeRound : 0;

    // Only show intro on fresh start
    if (history.length === 0) {
      store.setPhase(PHASES.INTRO);
      await sleep(600);
    }

    while (!abortRef.current) {
      const speakerKey = round % 2 === 0 ? "a" : "b";
      const result = await speakTurn({ speakerKey, personaIds, history });
      if (!result || abortRef.current) break;

      history = [...history, result.turn];
      round++;

      // Check if pause was requested — stop here, opponent doesn't get to respond
      if (pauseRequestedRef.current) {
        pauseRequestedRef.current = false;
        store.setPausePending(false);
        store.setPhase(PHASES.PAUSED);
        loopRunningRef.current = false;
        return;  // exit loop; resume() will restart it
      }

      await runJudgeScore(history, round); // strict sequencing: no background work

      if (mode === "ai_vs_ai" && round >= CONVERGE_CHECK_START) {
        const shouldConverge = await runConvergeCheck(history, round);
        if (shouldConverge && !abortRef.current) {
          store.setPhase(PHASES.CONVERGING);
          store.addSystemMessage("The debaters begin finding common ground...");
          for (const key of ["a", "b"]) {
            if (abortRef.current) break;
            const r = await speakTurn({ speakerKey: key, personaIds, history });
            if (r) history = [...history, r.turn];
          }
          break;
        }
      }

      await sleep(800); // pause between speakers
    }

    loopRunningRef.current = false;

    if (!abortRef.current) {
      store.setPhase(PHASES.ENDED);
      handleSaveReplay();
    }
  }, [store, speakTurn]);

  // ── Human mode ────────────────────────────────────────────────────────────

  const submitHumanTurn = useCallback(async (text) => {
    if (abortRef.current) return;
    const humanTurn = { role: "human", speaker: "You", text };
    store.addTurn(humanTurn);

    const history = [...useDebateStore.getState().history];
    const personaIds = store.personas.map((p) => p.id);

    await speakTurn({ speakerKey: "a", personaIds, history });

    const latestHistory = useDebateStore.getState().history;
    await runJudgeScore(latestHistory, latestHistory.length);

    if (!abortRef.current) store.setPhase(PHASES.HUMAN_TURN);
  }, [store, speakTurn]);

  // ── Steer ─────────────────────────────────────────────────────────────────

  const steer = useCallback(async (direction) => {
    const history = useDebateStore.getState().history;
    const { system_message } = await steerDebate(direction, history);
    store.addSystemMessage(system_message?.text || direction);
    // Don't set phase here - resume() will handle it
  }, [store]);

  // ── Replay ────────────────────────────────────────────────────────────────

  const handleSaveReplay = useCallback(async () => {
    const s = useDebateStore.getState();
    try {
      const { replay_id } = await saveReplay({
        topic: s.topic, mode: s.mode, personas: s.personas,
        history: s.history, scores: s.scores,
        moments: s.moments, round_num: s.roundNum,
      });
      store.setReplayId(replay_id);
    } catch (err) {
      console.warn("Replay save failed:", err);
    }
  }, [store]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const end = useCallback(() => {
    abortRef.current = true;
    // audio.stop(); // AUDIO PLACEHOLDER
    store.setPhase(PHASES.ENDED);
    handleSaveReplay();
  }, [store, handleSaveReplay]);

  const pause = useCallback(() => {
    // Signal the loop to pause after current speaker finishes their turn
    pauseRequestedRef.current = true;
    store.setPausePending(true);
  }, [store]);

  const resume = useCallback(async (runLoop) => {
    pauseRequestedRef.current = false;
    store.setPausePending(false);
    abortRef.current = false;

    // Wait for any running loop to finish before restarting
    while (loopRunningRef.current) {
      await sleep(50);
    }

    store.setPhase(PHASES.AI_THINKING);
    runLoop?.();
  }, [store]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { runAiVsAi, submitHumanTurn, steer, end, pause, resume, abort };
}