import { useState } from "react";
import { useDebateStore, PHASES } from "../../store/debateStore";
import { Button, Modal } from "../ui";

export function DebateControls({ onPause, onResume, onEnd, onSteer, onSteerOpen, onSteerCancel, mode }) {
  const { phase, topic, roundNum, pausePending } = useDebateStore();
  const [steerOpen, setSteerOpen] = useState(false);
  const [steerText, setSteerText] = useState("");
  const isPaused = phase === PHASES.PAUSED;
  const isEnded = phase === PHASES.ENDED;

  function handleSteerOpen() {
    setSteerOpen(true);
    onSteerOpen?.();  // Signal to pause the loop
  }

  function handleSteerCancel() {
    setSteerText("");
    setSteerOpen(false);
    onSteerCancel?.();  // Resume without changes
  }

  function handleSteer() {
    if (!steerText.trim()) return;
    const direction = steerText.trim();
    setSteerText("");
    setSteerOpen(false);
    onSteer(direction);  // Submit + resume handled by parent
  }

  return (
    <>
      <div style={{
        borderBottom: "1px solid var(--border)",
        padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--bg-2)", flexShrink: 0,
      }}>
        {/* Left: on-air + topic */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: isEnded ? "var(--text-dimmer)" : "var(--green)",
              animation: isEnded ? "none" : "onAirPulse 2s ease infinite",
            }} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 9,
              color: isEnded ? "var(--text-dimmer)" : "var(--green)",
              letterSpacing: 3, textTransform: "uppercase",
            }}>
              {isEnded ? "Off Air" : isPaused ? "Paused" : "Live"}
            </span>
          </div>
          <div style={{
            height: 16, width: 1, background: "var(--border)", flexShrink: 0,
          }} />
          <div style={{
            fontFamily: "var(--font-body)", fontStyle: "italic",
            fontSize: 13, color: "var(--text-dim)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {topic}
          </div>
        </div>

        {/* Right: round counter + controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dimmer)",
            letterSpacing: 2, marginRight: 4,
          }}>
            R{roundNum}
          </span>

          {!isEnded && mode === "ai_vs_ai" && (
            <Button
              variant="ghost" size="sm"
              onClick={handleSteerOpen}
            >
              ✎ Steer
            </Button>
          )}

          {!isEnded && (
            isPaused ? (
              <Button variant="ghost" size="sm" onClick={onResume}>▶ Resume</Button>
            ) : pausePending ? (
              <Button variant="ghost" size="sm" disabled style={{ opacity: 0.6, cursor: "wait" }}>⏳ Pausing...</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onPause}>⏸ Pause</Button>
            )
          )}

          {!isEnded && (
            <Button variant="danger" size="sm" onClick={onEnd}>⏹ End</Button>
          )}
        </div>
      </div>

      {/* Steer modal */}
      <Modal open={steerOpen} onClose={handleSteerCancel} title="✎ Steer the Debate">
        <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 16, lineHeight: 1.6 }}>
          Inject a moderator direction. Both AI agents will see this and naturally pivot.
        </p>
        <textarea
          autoFocus
          value={steerText}
          onChange={(e) => setSteerText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSteer(); }}}
          placeholder={`e.g. "Focus on the economic impact specifically" or "What about the effect on children?"`}
          rows={3}
          style={{
            width: "100%", padding: "12px 14px",
            background: "var(--bg-3)", border: "1px solid var(--border-2)",
            borderRadius: "var(--radius)", color: "var(--text)",
            fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.5,
            resize: "none", outline: "none", marginBottom: 16,
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--amber)"}
          onBlur={(e) => e.target.style.borderColor = "var(--border-2)"}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={handleSteerCancel}>Cancel</Button>
          <Button variant="primary" size="sm" disabled={!steerText.trim()} onClick={handleSteer}>
            Inject →
          </Button>
        </div>
      </Modal>
    </>
  );
}