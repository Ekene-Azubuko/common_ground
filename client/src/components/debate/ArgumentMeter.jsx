import { useDebateStore } from "../../store/debateStore";

export function ArgumentMeter() {
  const { scores, personas } = useDebateStore();
  const { a, b } = scores;

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Names */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
          letterSpacing: 2, textTransform: "uppercase",
        }}>
          {personas[0]?.name ?? "A"}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
          letterSpacing: 2, textTransform: "uppercase",
        }}>
          {personas[1]?.name ?? "B"}
        </span>
      </div>

      {/* Bar */}
      <div style={{
        height: 6, background: "var(--bg-3)",
        borderRadius: 3, overflow: "hidden", position: "relative",
      }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${a}%`,
          background: `linear-gradient(90deg, var(--amber), var(--green-dim))`,
          borderRadius: 3, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>

      {/* Percentages */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900,
          color: a > b ? "var(--amber)" : "var(--text-dimmer)",
          transition: "color 0.3s",
        }}>
          {a}%
        </span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
          letterSpacing: 2, alignSelf: "center",
        }}>
          EDGE
        </span>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900,
          color: b > a ? "var(--amber)" : "var(--text-dimmer)",
          transition: "color 0.3s",
        }}>
          {b}%
        </span>
      </div>
    </div>
  );
}