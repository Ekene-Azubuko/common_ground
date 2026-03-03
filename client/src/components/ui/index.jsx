// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, variant = "default", size = "md", disabled, onClick, style }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 6, fontFamily: "var(--font-display)", fontWeight: 700,
    letterSpacing: "0.05em", textTransform: "uppercase",
    border: "1px solid transparent", borderRadius: "var(--radius)",
    transition: "all 0.15s ease", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  };

  const sizes = {
    sm: { padding: "6px 14px", fontSize: 12 },
    md: { padding: "10px 20px", fontSize: 13 },
    lg: { padding: "14px 32px", fontSize: 15 },
  };

  const variants = {
    default: {
      background: "var(--bg-3)", borderColor: "var(--border-2)",
      color: "var(--text)",
    },
    primary: {
      background: "var(--amber)", borderColor: "var(--amber)",
      color: "#000",
    },
    danger: {
      background: "transparent", borderColor: "var(--red)",
      color: "var(--red)",
    },
    ghost: {
      background: "transparent", borderColor: "var(--border)",
      color: "var(--text-dim)",
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.filter = "brightness(1.1)";
        else if (variant === "danger") e.currentTarget.style.background = "var(--red-dim)";
        else e.currentTarget.style.borderColor = "var(--border-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "";
        e.currentTarget.style.background = variants[variant].background;
        e.currentTarget.style.borderColor = variants[variant].borderColor;
      }}
    >
      {children}
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-2)", border: "1px solid var(--border-2)",
          borderRadius: "var(--radius-lg)", padding: "28px 32px",
          minWidth: 380, maxWidth: 520, width: "90%",
          animation: "slideDown 0.2s ease",
        }}
      >
        {title && (
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700,
            letterSpacing: "0.05em", textTransform: "uppercase",
            color: "var(--amber)", marginBottom: 20,
          }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Tag / Badge ───────────────────────────────────────────────────────────────
export function Tag({ children, color = "default" }) {
  const colors = {
    default: { background: "var(--bg-3)", color: "var(--text-dim)", border: "var(--border)" },
    amber:   { background: "var(--amber-dim)", color: "var(--amber)", border: "var(--border-2)" },
    red:     { background: "var(--red-dim)", color: "var(--red)", border: "var(--red-dim)" },
    green:   { background: "var(--green-dim)", color: "var(--green)", border: "var(--border-2)" },
  };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px",
      fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
      borderRadius: 20, border: `1px solid ${colors[color].border}`,
      ...colors[color],
    }}>
      {children}
    </span>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      {label && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dimmer)", letterSpacing: 3, textTransform: "uppercase" }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ── Waveform (speaking indicator) ────────────────────────────────────────────
export function Waveform({ active, color = "var(--amber)" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 16 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          width: 2, height: "100%", background: color, borderRadius: 1,
          transformOrigin: "bottom",
          animation: active ? `waveform ${0.6 + i * 0.1}s ease-in-out ${i * 0.08}s infinite` : "none",
          transform: active ? undefined : "scaleY(0.3)",
          opacity: active ? 1 : 0.3,
        }} />
      ))}
    </div>
  );
}