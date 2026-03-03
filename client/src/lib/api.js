const BASE = "/api"; // proxied to Flask via vite.config.js

//  Debate 

/**
 * Stream a debate turn. Calls onChunk with each text fragment as it arrives.
 * Returns the full assembled text when done.
 */
export async function streamDebateTurn({ mode, topic, personaIds, history, speaker, customPersonas }, onChunk) {
  const res = await fetch(`${BASE}/debate/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      topic,
      persona_ids: personaIds,
      history,
      speaker: speaker ?? null,
      custom_personas: customPersonas ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || err.error || `HTTP ${res.status}`);
    error.status = res.status;
    error.isRateLimit = res.status === 429;
    throw error;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return fullText;
      try {
        const { chunk, error } = JSON.parse(payload);
        if (error) throw new Error(error);
        if (chunk) {
          fullText += chunk;
          onChunk(fullText);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullText;
}

export async function steerDebate(direction, history) {
  const res = await fetch(`${BASE}/debate/steer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction, history }),
  });
  return res.json();
}

export async function fetchPersonas() {
  const res = await fetch(`${BASE}/debate/personas`);
  return res.json();
}

// ── Judge ─────────────────────────────────────────────────────────────────────

export async function judgeScore({ topic, speakerAName, speakerBName, lastExchange }) {
  const res = await fetch(`${BASE}/judge/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      speaker_a_name: speakerAName,
      speaker_b_name: speakerBName,
      last_exchange: lastExchange,
    }),
  });
  return res.json();
}

export async function judgeConverge({ topic, speakerAName, speakerBName, history, roundNum }) {
  const res = await fetch(`${BASE}/judge/converge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      speaker_a_name: speakerAName,
      speaker_b_name: speakerBName,
      history,
      round_num: roundNum,
    }),
  });
  return res.json();
}

//  Audio 

/**
 * Fetch TTS audio and return an object URL the browser can play.
 */
export async function fetchAudio(text, voiceId) {
  const res = await fetch(`${BASE}/audio/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice_id: voiceId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "TTS failed");
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function cloneVoice(audioFile, name) {
  const form = new FormData();
  form.append("file", audioFile);
  form.append("name", name);

  const res = await fetch(`${BASE}/audio/clone`, {
    method: "POST",
    body: form,
  });
  return res.json(); // { voice_id, name }
}

//  Replay 

export async function saveReplay(debate) {
  const res = await fetch(`${BASE}/replay/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(debate),
  });
  return res.json(); // { replay_id, url }
}

export async function loadReplay(replayId) {
  const res = await fetch(`${BASE}/replay/${replayId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function listReplays() {
  const res = await fetch(`${BASE}/replay/list`);
  return res.json();
}