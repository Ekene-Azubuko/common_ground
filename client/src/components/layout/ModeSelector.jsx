import { useState } from "react";
import { Button } from "../ui";
import { useAudio } from "../../hooks/useAudio";

export function ModeSelector({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const { unlockAutoplay } = useAudio();

  function handleSelect(modeId) {
    unlockAutoplay(); // unlock browser autoplay on first user gesture
    onSelect(modeId);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 24,
    }}>
      {/* On-air indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 48, animation: "fadeIn 1s ease",
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "var(--red)",
          animation: "onAirPulse 2s ease infinite",
        }} />
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)",
          letterSpacing: 4, textTransform: "uppercase",
        }}>Live</span>
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "var(--font-display)", fontSize: "clamp(52px, 10vw, 96px)",
        fontWeight: 900, letterSpacing: "-2px", lineHeight: 0.9,
        textAlign: "center", marginBottom: 12,
        animation: "fadeUp 0.6s ease",
      }}>
        COMMON<br />
        <span style={{ color: "var(--amber)" }}>GROUND</span>
      </h1>

      <p style={{
        color: "var(--text-dim)", fontStyle: "italic", marginBottom: 64,
        textAlign: "center", animation: "fadeUp 0.6s ease 0.1s both",
      }}>
        Two perspectives. One stage. No winners — only understanding.
      </p>

      {/* Mode cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
        maxWidth: 680, width: "100%",
        animation: "fadeUp 0.6s ease 0.2s both",
      }}>
        {[
          {
            id: "human",
            title: "You vs AI",
            subtitle: "Human vs Machine",
            desc: "Pick a character. Make your argument. See if you can hold your own.",
            icon: "🎤",
            tag: "Interactive",
          },
          {
            id: "ai_vs_ai",
            title: "AI vs AI",
            subtitle: "Machine vs Machine",
            desc: "Two AI personas argue it out until they find common ground. You watch and moderate.",
            icon: "⚡",
            tag: "Spectator",
          },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleSelect(mode.id)}
            onMouseEnter={() => setHovered(mode.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === mode.id ? "var(--bg-3)" : "var(--bg-2)",
              border: `1px solid ${hovered === mode.id ? "var(--amber)" : "var(--border)"}`,
              borderRadius: "var(--radius-lg)", padding: "28px 24px",
              textAlign: "left", cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: hovered === mode.id ? "0 0 32px var(--amber-glow)" : "none",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{mode.icon}</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
              letterSpacing: 3, textTransform: "uppercase", marginBottom: 6,
            }}>
              {mode.subtitle}
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900,
              letterSpacing: "-0.5px", color: "var(--text)", marginBottom: 10,
            }}>
              {mode.title}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6, margin: 0 }}>
              {mode.desc}
            </p>
            <div style={{
              marginTop: 16,
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: hovered === mode.id ? "var(--amber)" : "var(--text-dimmer)",
              letterSpacing: 2, textTransform: "uppercase",
              transition: "color 0.2s",
            }}>
              {mode.tag} →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}