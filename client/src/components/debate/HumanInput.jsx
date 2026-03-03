import { useState } from "react";
import { useDebateStore, PHASES } from "../../store/debateStore";
import { Button } from "../ui";

const MAX_CHARS = 400;

export function HumanInput({ onSubmit }) {
  const [text, setText] = useState("");
  const { phase } = useDebateStore();

  const isDisabled = phase !== PHASES.HUMAN_TURN;
  const hint =
    phase === PHASES.AI_SPEAKING ? "AI is speaking..." :
    phase === PHASES.AI_THINKING ? "AI is thinking..." :
    phase === PHASES.ENDED       ? "Debate has ended" :
    "Your argument — press Enter to send";

  function handleSubmit() {
    if (!text.trim() || isDisabled) return;
    onSubmit(text.trim());
    setText("");
  }

  return (
    <div style={{
      borderTop: "1px solid var(--border)", padding: "14px 20px",
      background: "var(--bg-2)", flexShrink: 0,
    }}>
      <div style={{ position: "relative" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
          }}
          placeholder={hint}
          disabled={isDisabled}
          rows={2}
          style={{
            width: "100%", padding: "12px 100px 12px 16px",
            background: "var(--bg-3)",
            border: `1px solid ${isDisabled ? "var(--border)" : "var(--border-2)"}`,
            borderRadius: "var(--radius)", color: isDisabled ? "var(--text-dimmer)" : "var(--text)",
            fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.5,
            resize: "none", outline: "none", transition: "border-color 0.15s",
          }}
          onFocus={(e) => { if (!isDisabled) e.target.style.borderColor = "var(--amber)"; }}
          onBlur={(e) => e.target.style.borderColor = isDisabled ? "var(--border)" : "var(--border-2)"}
        />

        {/* Char count + send button */}
        <div style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
        }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 9,
            color: text.length > MAX_CHARS * 0.8 ? "var(--amber)" : "var(--text-dimmer)",
          }}>
            {text.length}/{MAX_CHARS}
          </span>
          <Button
            variant="primary" size="sm"
            disabled={isDisabled || !text.trim()}
            onClick={handleSubmit}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}