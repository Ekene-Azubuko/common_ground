import { useEffect, useRef } from "react";
import { useDebateStore, PHASES } from "../../store/debateStore";
import { useDebate } from "../../hooks/useDebate";
import { PersonaCard } from "./PersonaCard";
import { Transcript } from "./Transcript";
import { ArgumentMeter } from "./ArgumentMeter";
import { DebateControls } from "./DebateControls";
import { MomentBanner } from "./MomentBanner";
import { HumanInput } from "./HumanInput";
import { Button, Modal } from "../ui";

export function DebateStage({ onReset }) {
  const store = useDebateStore();
  const debate = useDebate();   // no audio arg needed for now
  const loopRef = useRef(null);

  const { mode, personas, scores, phase, replayId, loopStarted, error } = store;
  const isAiVsAi = mode === "ai_vs_ai";

  useEffect(() => {
    // Read directly from store (not the render-time snapshot) to handle StrictMode
    if (useDebateStore.getState().loopStarted) return;
    store.setLoopStarted(true);

    if (isAiVsAi) {
      loopRef.current = debate.runAiVsAi;
      debate.runAiVsAi();
    } else {
      store.setPhase(PHASES.AI_THINKING);
      debate.runAiVsAi().then(() => {
        store.setPhase(PHASES.HUMAN_TURN);
      });
    }

    // Don't abort on StrictMode's simulated unmount - the loopStarted flag
    // prevents duplicate starts. Only abort on real unmount (reset handles this).
  }, []);

  function handlePause() { debate.pause(); }
  function handleResume() { debate.resume(loopRef.current); }
  function handleEnd() { debate.end(); }

  // Steer flow: pause on open, resume on submit/cancel
  function handleSteerOpen() {
    debate.pause();  // Signal pause - current turn will finish, then loop exits
  }
  function handleSteerCancel() {
    debate.resume(loopRef.current);  // Resume without changes
  }
  async function handleSteer(direction) {
    await debate.steer(direction);  // Adds system message to history
    debate.resume(loopRef.current);  // Resume loop from store state
  }

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg)", overflow: "hidden",
    }}>
      <DebateControls
        mode={mode}
        onPause={handlePause}
        onResume={handleResume}
        onEnd={handleEnd}
        onSteer={handleSteer}
        onSteerOpen={handleSteerOpen}
        onSteerCancel={handleSteerCancel}
      />

      {/* Persona header */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        background: "var(--bg-2)", flexShrink: 0,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isAiVsAi ? "1fr auto 1fr" : "auto 1fr",
          alignItems: "center", gap: 20,
          maxWidth: 860, margin: "0 auto", width: "100%",
        }}>
          <PersonaCard persona={personas[0]} side="a" score={isAiVsAi ? scores.a : undefined} />

          {isAiVsAi && (
            <div style={{ flex: 1, minWidth: 160, textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                color: "var(--text-dim)", marginBottom: 8,
                letterSpacing: 1,
              }}>
                {personas[0]?.name} <span style={{ color: "var(--amber)", margin: "0 8px" }}>VS</span> {personas[1]?.name}
              </div>
              <ArgumentMeter />
            </div>
          )}

          {isAiVsAi ? (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PersonaCard persona={personas[1]} side="b" score={scores.b} />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
                  color: phase === PHASES.HUMAN_TURN ? "var(--amber)" : "var(--text-dim)",
                }}>
                  You
                </div>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
                  letterSpacing: 2,
                }}>
                  {phase === PHASES.HUMAN_TURN ? "YOUR TURN" : "LISTENING"}
                </div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: phase === PHASES.HUMAN_TURN ? "var(--amber-dim)" : "var(--bg-3)",
                border: `2px solid ${phase === PHASES.HUMAN_TURN ? "var(--amber)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, transition: "all 0.3s",
              }}>
                🎤
              </div>
            </div>
          )}
        </div>
      </div>

      <Transcript />

      {phase === PHASES.ENDED && (
        <div style={{
          borderTop: "1px solid var(--border)", padding: "20px 24px",
          background: "var(--bg-2)", textAlign: "center", flexShrink: 0,
          animation: "fadeUp 0.4s ease",
        }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900,
            color: "var(--amber)", marginBottom: 4, letterSpacing: "0.05em",
          }}>
            Debate Complete
          </div>
          {replayId && (
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dimmer)",
              letterSpacing: 2, marginBottom: 16,
            }}>
              SAVED · ID: {replayId}
            </div>
          )}
          <Button variant="primary" size="md" onClick={onReset}>New Debate</Button>
        </div>
      )}

      {!isAiVsAi && phase !== PHASES.ENDED && (
        <HumanInput onSubmit={debate.submitHumanTurn} />
      )}

      <MomentBanner />

      {/* Rate limit error modal */}
      <Modal
        open={error?.type === "rate_limit"}
        onClose={() => { store.clearError(); onReset(); }}
        title="⚠️ Daily Limit Reached"
      >
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--text)",
          lineHeight: 1.6,
          marginBottom: 20,
        }}>
          {error?.message || "You've reached your daily debate limit. Come back tomorrow for more debates!"}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { store.clearError(); onReset(); }}
          >
            Got it
          </Button>
        </div>
      </Modal>
    </div>
  );
}