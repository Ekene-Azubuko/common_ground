import { useDebateStore, PHASES } from "../../store/debateStore";

export function PersonaCard({ persona, side, score }) {
  const { phase, activeSpeaker } = useDebateStore();
  const isActive = activeSpeaker === side;
  const isTyping = isActive && (phase === PHASES.AI_SPEAKING || phase === PHASES.AI_THINKING);
  const isLeft = side === "a";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isLeft ? "flex-start" : "flex-end",
      gap: 6,
    }}>
      {/* Avatar */}
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: isActive ? "var(--amber-dim)" : "var(--bg-3)",
        border: `2px solid ${isActive ? "var(--amber)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, transition: "all 0.3s",
      }}>
        {persona?.emoji}
      </div>

      {/* Name + status */}
      <div style={{ textAlign: isLeft ? "left" : "right" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
          letterSpacing: "0.02em", color: isActive ? "var(--text)" : "var(--text-dim)",
        }}>
          {persona?.name}
        </div>
        <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: isLeft ? "flex-start" : "flex-end" }}>
          {isTyping && (
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--amber)",
              letterSpacing: 2, animation: "pulse 1s ease infinite",
            }}>
              TYPING...
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      {score !== undefined && (
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900,
          color: isActive ? "var(--amber)" : "var(--text-dim)",
          lineHeight: 1, transition: "color 0.3s",
        }}>
          {score}%
        </div>
      )}
    </div>
  );
}