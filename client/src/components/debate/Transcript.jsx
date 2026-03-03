import { useEffect, useRef } from "react";
import { useDebateStore, PHASES } from "../../store/debateStore";

function Bubble({ turn, personas, isStreaming }) {
  const isSystem = turn.role === "system";
  const isHuman  = turn.role === "human";
  const isPersonaA = personas[0] && turn.speaker === personas[0].name;
  const isRight = isHuman || (!isPersonaA && !isSystem);

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", margin: "16px 0", animation: "fadeIn 0.3s ease" }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--text-dimmer)", letterSpacing: 2, fontStyle: "italic",
        }}>
          — {turn.text} —
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isRight ? "flex-end" : "flex-start",
      marginBottom: 20, animation: isStreaming ? "fadeIn 0.15s ease" : "fadeUp 0.3s ease",
    }}>
      {/* Speaker label */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
        flexDirection: isRight ? "row-reverse" : "row",
      }}>
        <span style={{ fontSize: 14 }}>
          {isHuman ? "🎤" : (isPersonaA ? personas[0]?.emoji : personas[1]?.emoji)}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
          letterSpacing: 2, textTransform: "uppercase",
        }}>
          {turn.speaker}
        </span>
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: "72%", padding: "13px 18px",
        borderRadius: isRight ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        background: isHuman ? "var(--amber-dim)" : "var(--bg-2)",
        border: `1px solid ${isHuman ? "var(--border-2)" : isStreaming ? "var(--border-2)" : "var(--border)"}`,
        fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.75,
        color: "var(--text)",
      }}>
        {turn.text}
        {/* Blinking cursor while streaming */}
        {isStreaming && (
          <span style={{
            display: "inline-block", width: 2, height: "1em",
            background: "var(--amber)", marginLeft: 3,
            verticalAlign: "text-bottom",
            animation: "blink 0.7s ease infinite",
          }} />
        )}
      </div>
    </div>
  );
}

export function Transcript() {
  const { history, streamingText, activeSpeaker, personas, phase } = useDebateStore();
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isStreaming = (phase === PHASES.AI_THINKING || phase === PHASES.AI_SPEAKING) && !!streamingText;

  // Smooth-scroll only when a new committed turn lands
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length]);

  // During streaming, nudge scroll only when near the bottom (no smooth — avoids jitter)
  useEffect(() => {
    if (!streamingText) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 220) el.scrollTop = el.scrollHeight;
  }, [streamingText]);

  // Build the streaming speaker name from activeSpeaker
  const streamingSpeaker = activeSpeaker === "a" ? personas[0]?.name : personas[1]?.name;
  const streamingEmoji   = activeSpeaker === "a" ? personas[0]?.emoji : personas[1]?.emoji;

  return (
    <div ref={scrollContainerRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

      {/* Empty state */}
      {history.length === 0 && !streamingText && (
        <div style={{
          height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text-dimmer)", fontFamily: "var(--font-mono)", fontSize: 12,
          letterSpacing: 2, animation: "pulse 3s ease infinite",
        }}>
          STANDBY · DEBATE STARTING
        </div>
      )}

      {/* Committed turns */}
      {history.map((turn, i) => (
        <Bubble key={i} turn={turn} personas={personas} isStreaming={false} />
      ))}

      {/* Live streaming bubble */}
      {isStreaming && streamingText && (
        <Bubble
          turn={{ role: "ai", speaker: streamingSpeaker, emoji: streamingEmoji, text: streamingText }}
          personas={personas}
          isStreaming
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}