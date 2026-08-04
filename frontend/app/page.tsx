"use client";

import { useState } from "react";

/**
 * Voxa — AI Text-to-Speech (simplified)
 * Single-file page.tsx (Next.js App Router)
 *
 * UI only — wire `handleGenerate` up to your own API.
 */

const VOICES = [
  { id: "af_alloy", name: "Alloy"},
  { id: "af_bella", name: "Bella"},
  { id: "am_adam", name: "Adam"},
  { id: "am_michael", name: "Michael"},
];

const CHAR_LIMIT = 800;
const EXAMPLE_TEXT =
  "Good morning. Today's forecast calls for clear skies and a gentle breeze from the west.";

export default function Page() {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [speed, setSpeed] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");

  const charCount = text.length;
  const overLimit = charCount > CHAR_LIMIT;
  const canGenerate = text.trim().length > 0 && !overLimit && !isGenerating;
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  async function handleGenerate() {
    if (!canGenerate) return;

    setIsGenerating(true);

    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId,
          speed,
        }),
      });

      const data = await response.json();

      const audioUrl = `${API_URL}/outputs/${data.filename}`;

      setAudioUrl(audioUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#FFF4EC] px-4 py-10 text-[#111111] sm:px-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Voxa</h1>
        <p className="mt-1 text-sm text-black/60">
          Type a script, pick a voice, and generate speech.
        </p>
      </header>

      {/* Script */}
      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="script" className="text-sm font-semibold">
            Script
          </label>
          <button
            type="button"
            onClick={() => setText(EXAMPLE_TEXT)}
            className="text-xs font-medium text-[#D94F0A] hover:underline"
          >
            Use an example
          </button>
        </div>
        <textarea
          id="script"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing the words you want to hear…"
          rows={8}
          className="w-full resize-none rounded-xl border border-black/10 bg-white p-3 text-sm leading-relaxed placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className={overLimit ? "font-medium text-[#D94F0A]" : "text-black/45"}>
            {charCount} / {CHAR_LIMIT} characters
          </span>
          {text && (
            <button
              type="button"
              onClick={() => setText("")}
              className="text-black/45 hover:text-[#D94F0A]"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Voice */}
      <section className="mb-5">
        <label htmlFor="voice" className="mb-2 block text-sm font-semibold">
          Voice
        </label>
        <select
          id="voice"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
        >
          {VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </section>

      {/* Speed */}
      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <label htmlFor="speed" className="font-semibold">
            Speed
          </label>
          <span className="text-black/50">{speed.toFixed(2)}×</span>
        </div>
        <input
          id="speed"
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer accent-[#D94F0A]"
        />
      </section>

      {/* Generate */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full rounded-full bg-[#D94F0A] px-6 py-3 text-sm font-semibold text-[#FFF4EC] transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isGenerating ? "Generating…" : "Generate speech"}
      </button>
      {audioUrl && (
        <div className="mt-6">
          <audio controls className="w-full" src={audioUrl} />
        </div>
      )}
    </main>
  );
}