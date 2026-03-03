import { useState, useEffect } from "react";
import { useDebateStore } from "../../store/debateStore";

export function MomentBanner() {
  const { moments } = useDebateStore();
  const [visible, setVisible] = useState(null);
  const [lastSeen, setLastSeen] = useState(0);

  useEffect(() => {
    if (moments.length > lastSeen) {
      const latest = moments[moments.length - 1];
      setVisible(latest);
      setLastSeen(moments.length);

      const timer = setTimeout(() => setVisible(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [moments, lastSeen]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
      zIndex: 500, maxWidth: 480, width: "90%",
      animation: "momentPop 4.5s ease forwards",
      pointerEvents: "none",
    }}>
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--amber)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 18px",
        boxShadow: "0 0 32px var(--amber-glow), 0 8px 32px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--amber)",
          letterSpacing: 3, textTransform: "uppercase", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ▶ Hot Take · {visible.speaker}
        </div>
        <div style={{
          fontFamily: "var(--font-body)", fontStyle: "italic",
          fontSize: 14, color: "var(--text)", lineHeight: 1.5,
        }}>
          "{visible.text}"
        </div>
      </div>
    </div>
  );
}