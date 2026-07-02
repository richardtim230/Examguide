// services/gemini.js
/**
 * Generic Gemini adapter with optional streaming support.
 * - sendToGemini(messages, opts)
 * - streamToGemini(messages, opts, onChunk) returns { finished: Promise<string> }
 *
 * Set GEMINI_API_URL and GEMINI_API_KEY in env.
 *
 * If response supports streaming (response.body), streamToGemini will call onChunk(chunkText).
 * Otherwise it falls back to single-response sendToGemini.
 */
import fetch from "node-fetch"; // If using Node 18+ you can remove this import and use global fetch.

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "";

if (!GEMINI_API_URL || !GEMINI_API_KEY) {
  console.warn("GEMINI_API_URL or GEMINI_API_KEY not set — Gemini calls will fail until configured.");
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [{ role: "user", content: String(messages) }];
  return messages.map(m => {
    if (typeof m === "string") return { role: "user", content: m };
    return m;
  });
}

export async function sendToGemini(messages, opts = {}) {
  const body = {
    model: opts.model || GEMINI_MODEL || "gemini",
    messages: normalizeMessages(messages),
    temperature: typeof opts.temperature === "number" ? opts.temperature : 0.2,
    maxOutputTokens: opts.maxTokens || opts.maxOutputTokens || 1024
  };

  const res = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text().catch(()=>"");
    throw new Error(`Gemini request failed ${res.status}: ${txt}`);
  }

  // If the endpoint streams with chunked responses, this won't be executed in streaming mode.
  const data = await res.json();
  // adapt parsing based on actual API shape
  if (data.outputText) return data.outputText;
  if (data.candidates && data.candidates[0] && data.candidates[0].content) return data.candidates[0].content;
  // fallback
  return JSON.stringify(data);
}

/**
 * Attempts streaming. onChunk receives text chunks (string).
 * If streaming not supported, falls back to non-streamed sendToGemini and calls onChunk once with full response.
 *
 * Returns { wait: Promise<string> } which resolves to full text.
 */
export async function streamToGemini(messages, opts = {}, onChunk = ()=>{}) {
  const body = {
    model: opts.model || GEMINI_MODEL || "gemini",
    messages: normalizeMessages(messages),
    temperature: typeof opts.temperature === "number" ? opts.temperature : 0.2,
    maxOutputTokens: opts.maxTokens || opts.maxOutputTokens || 1024,
    stream: true // best-effort flag; real API may ignore
  };

  const res = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text().catch(()=>"");
    throw new Error(`Gemini request failed ${res.status}: ${txt}`);
  }

  // If the API uses a streaming response body, read it.
  if (res.body && typeof res.body.getReader === "function") {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let full = "";

    while (!done) {
      const { value, done: rdrDone } = await reader.read();
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        // Try to parse chunk if JSON-ish, else pass raw
        try {
          // Some stream formats send JSON lines
          // We'll pass the raw chunk to the onChunk handler
          onChunk(chunk);
          full += chunk;
        } catch (err) {
          onChunk(chunk);
          full += chunk;
        }
      }
      done = rdrDone;
    }
    // final
    return { wait: Promise.resolve(full) };
  } else {
    // fallback: API didn't stream; parse JSON and call onChunk once
    const data = await res.json().catch(()=>null);
    let text = "";
    if (data) {
      if (data.outputText) text = data.outputText;
      else if (data.candidates && data.candidates[0] && data.candidates[0].content) text = data.candidates[0].content;
      else text = JSON.stringify(data);
    }
    onChunk(text);
    return { wait: Promise.resolve(text) };
  }
}
