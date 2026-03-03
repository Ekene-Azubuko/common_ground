import { useState, useEffect } from "react";
import { fetchPersonas } from "../../lib/api";
import { PRESET_TOPICS } from "../../lib/topics";
import { Button, Divider, Modal } from "../ui";

const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Socrates voice as default

const EMOJI_OPTIONS = [
  "🧠","👁️","🦁","🐍","🌊","⚔️","🔥","🌙","👾","🎭",
  "🧬","💀","🌹","🦅","🐺","🎪","🧿","⚗️","🌋","🗿",
];

function CustomPersonaModal({ open, onClose, onSave, editPersona }) {
  const [name, setName]         = useState("");
  const [emoji, setEmoji]       = useState("🎭");
  const [description, setDesc]  = useState("");
  const [style, setStyle]       = useState("");
  const [background, setBg]     = useState("");

  // Pre-fill when editing
  useEffect(() => {
    if (editPersona) {
      setName(editPersona.name || "");
      setEmoji(editPersona.emoji || "🎭");
      setDesc(editPersona.description || "");
      setStyle(editPersona.style || "");
      setBg(editPersona.background || "");
    } else {
      setName(""); setEmoji("🎭"); setDesc(""); setStyle(""); setBg("");
    }
  }, [editPersona, open]);

  function handleSave() {
    if (!name.trim() || !style.trim()) return;
    onSave({
      id: editPersona?.id || `custom_${Date.now()}`,
      name: name.trim(),
      emoji,
      description: description.trim() || style.trim(),
      style: style.trim(),
      background: background.trim(),
      el_voice_id: editPersona?.el_voice_id || DEFAULT_VOICE_ID,
      oai_voice: editPersona?.oai_voice || "alloy",
      isCustom: true,
    });
    // Reset
    setName(""); setEmoji("🎭"); setDesc(""); setStyle(""); setBg("");
    onClose();
  }

  const canSave = name.trim() && style.trim();

  return (
    <Modal open={open} onClose={onClose} title={editPersona ? "✎ Edit Persona" : "✦ Create Custom Persona"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Name + Emoji row */}
        <div style={{ display: "flex", gap: 12 }}>
          {/* Emoji picker */}
          <div>
            <FieldLabel>Icon</FieldLabel>
            <div style={{ position: "relative" }}>
              <select
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                style={{
                  width: 64, height: 48, background: "var(--bg-3)",
                  border: "1px solid var(--border-2)", borderRadius: "var(--radius)",
                  color: "var(--text)", fontSize: 24, textAlign: "center",
                  cursor: "pointer", outline: "none",
                }}
              >
                {EMOJI_OPTIONS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div style={{ flex: 1 }}>
            <FieldLabel>Name *</FieldLabel>
            <TextInput
              value={name}
              onChange={setName}
              placeholder="e.g. Machiavelli, Carl Sagan, Your CEO..."
            />
          </div>
        </div>

        {/* Debate style — most important field */}
        <div>
          <FieldLabel>Debate Style *</FieldLabel>
          <FieldHint>This shapes every response. Be specific.</FieldHint>
          <textarea
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder={`e.g. "Speaks in cold corporate euphemisms, always deflects blame to market forces, cites ROI for every human problem"`}
            rows={3}
            style={textareaStyle}
            onFocus={(e) => e.target.style.borderColor = "var(--amber)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border-2)"}
          />
        </div>

        {/* Background / persona context */}
        <div>
          <FieldLabel>Background</FieldLabel>
          <FieldHint>Who are they? What have they lived through? Optional but adds depth.</FieldHint>
          <textarea
            value={background}
            onChange={(e) => setBg(e.target.value)}
            placeholder={`e.g. "A burned-out Silicon Valley engineer who sold their startup and now believes all tech is inherently harmful"`}
            rows={2}
            style={textareaStyle}
            onFocus={(e) => e.target.style.borderColor = "var(--amber)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border-2)"}
          />
        </div>

        {/* Short description (shown in card) */}
        <div>
          <FieldLabel>Card Description</FieldLabel>
          <FieldHint>One line shown on the persona card. Defaults to style if left blank.</FieldHint>
          <TextInput
            value={description}
            onChange={setDesc}
            placeholder="e.g. Weaponizes buzzwords, never answers directly"
          />
        </div>

        {/* Preview */}
        {name && (
          <div style={{
            padding: "12px 14px",
            background: "var(--bg-3)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
              letterSpacing: 3, textTransform: "uppercase", marginBottom: 8,
            }}>
              Preview
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>{emoji}</span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
                  {name}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)", marginTop: 2 }}>
                  {description || style || "No style set yet"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" disabled={!canSave} onClick={handleSave}>
            {editPersona ? "Save Changes →" : "Add Persona →"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <div style={{
      fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
      letterSpacing: 3, textTransform: "uppercase", marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function FieldHint({ children }) {
  return (
    <div style={{
      fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 12,
      color: "var(--text-dimmer)", marginBottom: 8, marginTop: -2,
    }}>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 14px",
        background: "var(--bg-3)", border: "1px solid var(--border-2)",
        borderRadius: "var(--radius)", color: "var(--text)",
        fontFamily: "var(--font-body)", fontSize: 14, outline: "none",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => e.target.style.borderColor = "var(--amber)"}
      onBlur={(e) => e.target.style.borderColor = "var(--border-2)"}
    />
  );
}

const textareaStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-3)", border: "1px solid var(--border-2)",
  borderRadius: "var(--radius)", color: "var(--text)",
  fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.6,
  resize: "none", outline: "none", transition: "border-color 0.15s",
};

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "cg_custom_personas";

function loadSavedPersonas() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function persistPersonas(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// ── Main SetupScreen ──────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

export function SetupScreen({ mode, onStart, onBack }) {
  const [serverPersonas, setServerPersonas] = useState([]);
  const [customPersonas, setCustomPersonas] = useState(loadSavedPersonas);
  const [topic, setTopic]       = useState("");
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);  // persona being edited
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const isSinglePersona = mode === "human";

  // All personas = server built-ins + user-created customs
  const allPersonas = [...serverPersonas, ...customPersonas];

  useEffect(() => {
    fetchPersonas()
      .then(setServerPersonas)
      .catch(() => setServerPersonas([]))
      .finally(() => setLoading(false));
  }, []);

  function handleCustomSave(persona) {
    setCustomPersonas((prev) => {
      // If editing, replace existing; otherwise append
      const existingIdx = prev.findIndex((p) => p.id === persona.id);
      let next;
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = persona;
      } else {
        next = [...prev, persona];
      }
      persistPersonas(next);
      return next;
    });
    setEditingPersona(null);
    // Auto-select, and expand view so it's immediately visible
    setVisibleCount((c) => Math.max(c, PAGE_SIZE));
    if (!selectedA) setSelectedA(persona.id);
    else if (!isSinglePersona && !selectedB) setSelectedB(persona.id);
  }

  function handleCustomDelete(id) {
    setCustomPersonas((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persistPersonas(next);
      return next;
    });
    if (selectedA === id) setSelectedA(null);
    if (selectedB === id) setSelectedB(null);
  }

  function handleCustomEdit(persona) {
    setEditingPersona(persona);
    setBuilderOpen(true);
  }

  function handleBuilderClose() {
    setBuilderOpen(false);
    setEditingPersona(null);
  }

  function handleCardClick(p) {
    if (isSinglePersona) {
      setSelectedA(selectedA === p.id ? null : p.id);
    } else {
      if (selectedA === p.id) setSelectedA(null);
      else if (selectedB === p.id) setSelectedB(null);
      else if (!selectedA) setSelectedA(p.id);
      else if (!selectedB && p.id !== selectedA) setSelectedB(p.id);
    }
  }

  const canStart = topic.trim() && selectedA && (isSinglePersona || selectedB) && selectedA !== selectedB;

  function handleStart() {
    if (!canStart) return;
    const personaIds = isSinglePersona ? [selectedA] : [selectedA, selectedB];

    // Pass custom persona objects through for the backend
    const customA = customPersonas.find((p) => p.id === selectedA);
    const customB = customPersonas.find((p) => p.id === selectedB);

    onStart({
      topic: topic.trim(),
      personaIds,
      customPersonas: [customA, customB].filter(Boolean),
    });
  }

  const getPersonaName = (id) => allPersonas.find((p) => p.id === id)?.name ?? id;

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)", padding: "40px 24px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ maxWidth: 680, width: "100%", animation: "fadeUp 0.4s ease" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button onClick={onBack} style={{
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dimmer)",
            letterSpacing: 2, textTransform: "uppercase", background: "none", border: "none",
            cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 6,
          }}>
            ← Back
          </button>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dimmer)",
            letterSpacing: 4, textTransform: "uppercase", marginBottom: 8,
          }}>
            {mode === "human" ? "You vs AI" : "AI vs AI"} · Setup
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 900,
            letterSpacing: "-1px", color: "var(--text)",
          }}>
            Configure the Debate
          </h2>
        </div>

        {/* Topic */}
        <section style={{ marginBottom: 36 }}>
          <label style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dimmer)",
            letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 12,
          }}>
            Debate Topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What should they argue about?"
            rows={2}
            style={{
              width: "100%", padding: "14px 16px",
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", color: "var(--text)",
              fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5,
              resize: "none", outline: "none", transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--amber)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PRESET_TOPICS.map((t) => (
              <button
                key={t.label}
                onClick={() => setTopic(t.label)}
                style={{
                  padding: "4px 12px", background: "transparent",
                  border: "1px solid var(--border)", borderRadius: 20,
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  color: topic === t.label ? "var(--amber)" : "var(--text-dimmer)",
                  borderColor: topic === t.label ? "var(--amber)" : "var(--border)",
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ opacity: 0.5 }}>{"🔥".repeat(Math.floor(t.score / 4))}</span>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <Divider label="Choose Personas" />

        {/* Persona grid */}
        {loading ? (
          <div style={{
            textAlign: "center", color: "var(--text-dimmer)",
            fontFamily: "var(--font-mono)", fontSize: 12, padding: 40,
          }}>
            Loading personas...
          </div>
        ) : (
          <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>

            {/* Built-in + custom persona cards */}
            {allPersonas.slice(0, visibleCount).map((p) => {
              const isA = selectedA === p.id;
              const isB = selectedB === p.id;
              const isSelected = isA || isB;
              const label = isA ? (isSinglePersona ? "Selected" : "Side A (FOR)") : isB ? "Side B (AGAINST)" : null;
              const labelColor = isA ? "var(--amber)" : "var(--blue)";

              return (
                <button
                  key={p.id}
                  onClick={() => handleCardClick(p)}
                  style={{
                    padding: "16px 12px", textAlign: "center",
                    background: isSelected ? "var(--bg-3)" : "var(--bg-2)",
                    border: `1px solid ${isA ? "var(--amber)" : isB ? "var(--blue)" : "var(--border)"}`,
                    borderRadius: "var(--radius)", cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: isA ? "0 0 16px var(--amber-glow)" : "none",
                    position: "relative",
                  }}
                >
                  {/* Custom badge + delete button */}
                  {p.isCustom && (
                    <>
                      <div style={{
                        position: "absolute", top: 6, right: 6,
                        fontFamily: "var(--font-mono)", fontSize: 8,
                        color: "var(--amber)", letterSpacing: 1,
                        background: "var(--amber-dim)", padding: "1px 5px",
                        borderRadius: 10, border: "1px solid var(--border-2)",
                      }}>
                        CUSTOM
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCustomDelete(p.id); }}
                        title="Delete persona"
                        style={{
                          position: "absolute", top: 4, left: 4,
                          width: 18, height: 18, borderRadius: "50%",
                          background: "var(--bg-3)", border: "1px solid var(--border-2)",
                          color: "var(--text-dimmer)", fontSize: 11, lineHeight: 1,
                          cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          padding: 0, transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--red-dim)";
                          e.currentTarget.style.borderColor = "var(--red)";
                          e.currentTarget.style.color = "var(--red)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--bg-3)";
                          e.currentTarget.style.borderColor = "var(--border-2)";
                          e.currentTarget.style.color = "var(--text-dimmer)";
                        }}
                      >
                        ×
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCustomEdit(p); }}
                        title="Edit persona"
                        style={{
                          position: "absolute", top: 4, left: 26,
                          width: 18, height: 18, borderRadius: "50%",
                          background: "var(--bg-3)", border: "1px solid var(--border-2)",
                          color: "var(--text-dimmer)", fontSize: 9, lineHeight: 1,
                          cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          padding: 0, transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--amber-dim)";
                          e.currentTarget.style.borderColor = "var(--amber)";
                          e.currentTarget.style.color = "var(--amber)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--bg-3)";
                          e.currentTarget.style.borderColor = "var(--border-2)";
                          e.currentTarget.style.color = "var(--text-dimmer)";
                        }}
                      >
                        ✎
                      </button>
                    </>
                  )}
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{p.emoji}</div>
                  <div style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
                    color: isSelected ? "var(--text)" : "var(--text-dim)",
                  }}>
                    {p.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dimmer)",
                    marginTop: 4, lineHeight: 1.4,
                  }}>
                    {p.description}
                  </div>
                  {label && (
                    <div style={{
                      marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 9,
                      color: labelColor, letterSpacing: 2, textTransform: "uppercase",
                    }}>
                      {label}
                    </div>
                  )}
                </button>
              );
            })}

            {/* Create Custom card — always visible */}
            <button
              onClick={() => setBuilderOpen(true)}
              style={{
                padding: "16px 12px", textAlign: "center",
                background: "transparent",
                border: "1px dashed var(--border-2)",
                borderRadius: "var(--radius)", cursor: "pointer",
                transition: "all 0.15s", color: "var(--text-dimmer)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 120,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--amber)";
                e.currentTarget.style.color = "var(--amber)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-2)";
                e.currentTarget.style.color = "var(--text-dimmer)";
              }}
            >
              <div style={{ fontSize: 24 }}>✦</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>
                Create Custom
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: 1 }}>
                Build your own
              </div>
            </button>
          </div>

          {/* Load More */}
          {visibleCount < allPersonas.length && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                style={{
                  padding: "8px 24px",
                  background: "transparent",
                  border: "1px solid var(--border-2)",
                  borderRadius: "var(--radius)",
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  color: "var(--text-dimmer)", letterSpacing: 2,
                  textTransform: "uppercase", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--amber)";
                  e.currentTarget.style.color = "var(--amber)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-2)";
                  e.currentTarget.style.color = "var(--text-dimmer)";
                }}
              >
                Load More · {allPersonas.length - visibleCount} remaining
              </button>
            </div>
          )}
          </>
        )}

        {/* Selection summary */}
        {(selectedA || selectedB) && (
          <div style={{
            marginTop: 20, padding: "12px 16px",
            background: "var(--bg-2)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: 12,
            color: "var(--text-dim)", display: "flex", gap: 16, flexWrap: "wrap",
          }}>
            {selectedA && <span><span style={{ color: "var(--amber)" }}>A:</span> {getPersonaName(selectedA)}</span>}
            {selectedB && <span><span style={{ color: "var(--blue)" }}>B:</span> {getPersonaName(selectedB)}</span>}
          </div>
        )}

        {/* Start */}
        <div style={{ marginTop: 36, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" size="lg" disabled={!canStart} onClick={handleStart}>
            Start Debate →
          </Button>
        </div>
      </div>

      {/* Custom persona builder modal */}
      <CustomPersonaModal
        open={builderOpen}
        onClose={handleBuilderClose}
        onSave={handleCustomSave}
        editPersona={editingPersona}
      />
    </div>
  );
}