"use client";

import { useEffect, useState } from "react";
import { ScriptEditor } from "../components/ScriptEditor";
import { VoiceSelect } from "../components/VoiceSelect";
import { SpeedControl } from "../components/SpeedControl";
import { GenerateButton } from "../components/GenerateButton";
import { GeneratedFile } from "../components/GeneratedFile";
import {
  GenerationHistory,
  type Generation,
} from "../components/GenerationHistory";
import { GeneratedFilesList } from "../components/GeneratedFilesList";
import { OCRSection } from "../components/OCRSection";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

/**
 * Voxa — AI Text-to-Speech
 * Single-file page.tsx (Next.js App Router)
 *
 * Design tokens (light theme):
 *   bg         #F3F7FF   soft blue-white
 *   card       #FFFFFF
 *   ink        #15172B
 *   ink-muted  #676C89
 *   border     #DCE9FB
 *   accent     #2563EB   confident blue
 *   accent-soft #DBEAFE
 *   amber      #FF8A3D   waveform / generate accent
 *
 * Type: Space Grotesk (display), Inter (body), IBM Plex Mono (data/utility)
 */

type VoiceOption = {
  id: string;
  name: string;
};

type AppConfig = {
  voices: VoiceOption[];
  minTextLength: number;
  maxTextLength: number;
  minSpeed: number;
  maxSpeed: number;
};

const EXAMPLE_TEXT =
  "Hello! Welcome to Voxa, an AI-powered text-to-speech application built with FastAPI, React, and the Kokoro model. This demo showcases natural voice synthesis with adjustable voices and playback controls.";

// Waveform signature — a static amplitude readout, not a generic AI motif.
// Heights are fixed (not random) so the divider looks designed, not noisy.
const WAVE_HEIGHTS = [
  6, 14, 9, 22, 16, 28, 12, 20, 8, 24, 15, 10, 18, 7, 13, 21, 9, 16, 6, 11,
];

type InputMode = "script" | "ocr";

function WaveformDivider() {
  return (
    <div
      className="flex items-end justify-center gap-[3px] py-1"
      role="presentation"
      aria-hidden="true"
    >
      {WAVE_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${h}px`,
            backgroundColor: i % 3 === 0 ? "#FF8A3D" : "#2563EB",
            opacity: i % 3 === 0 ? 0.85 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[#DCE9FB] bg-white px-4 py-3 shadow-sm">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
        {label}
      </span>
      <span className="font-mono text-base font-medium text-[#15172B]">
        {value}
      </span>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}) {
  const isScript = mode === "script";
  return (
    <div
      role="tablist"
      aria-label="Input mode"
      className="inline-flex rounded-full border border-[#DCE9FB] bg-white p-1 shadow-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={isScript}
        onClick={() => onChange("script")}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
          isScript
            ? "bg-[#2563EB] text-white shadow-sm"
            : "text-[#676C89] hover:text-[#15172B]"
        }`}
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
        Script
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!isScript}
        onClick={() => onChange("ocr")}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
          !isScript
            ? "bg-[#2563EB] text-white shadow-sm"
            : "text-[#676C89] hover:text-[#15172B]"
        }`}
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M16 3h-8v4" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        OCR Scanner
      </button>
    </div>
  );
}

export default function Page() {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [speed, setSpeed] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(
    null
  );
  const [history, setHistory] = useState<Generation[]>([]);
  const [minTextLength, setMinTextLength] = useState(1);
  const [maxTextLength, setMaxTextLength] = useState(800);
  const [minSpeed, setMinSpeed] = useState(0.5);
  const [maxSpeed, setMaxSpeed] = useState(1.5);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("script");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const selectedAudioUrl = selectedGeneration
    ? `${API_URL}/outputs/${selectedGeneration.filename}`
    : "";

  const charCount = text.length;
  const overLimit = charCount > maxTextLength;
  const canGenerate =
    text.trim().length >= minTextLength &&
    !overLimit &&
    !isGenerating &&
    !!voiceId;

  async function loadConfig() {
    try {
      const response = await fetch(`${API_URL}/config`);
      const data: AppConfig = await response.json();
      setVoiceOptions(data.voices);
      setMinTextLength(data.minTextLength);
      setMaxTextLength(data.maxTextLength);
      setMinSpeed(data.minSpeed);
      setMaxSpeed(data.maxSpeed);
      if (!voiceId && data.voices.length > 0) {
        setVoiceId(data.voices[0].id);
      }
      setConfigLoaded(true);
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  }

  async function loadHistory() {
    try {
      const response = await fetch(`${API_URL}/audio`);
      const data = await response.json();
      const items: Generation[] = data.files || [];
      setHistory(items);
      if (!selectedGeneration && items.length > 0) {
        setSelectedGeneration(items[0]);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }

  useEffect(() => {
    loadConfig();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGenerationSelect(filename: string) {
    const selected = history.find((item) => item.filename === filename) || null;
    setSelectedGeneration(selected);
  }

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
      const filename = data.filename;

      await loadHistory();
      handleGenerationSelect(filename);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleUseExtractedText(extracted: string) {
    setText(extracted);
    setInputMode("script");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F7FF] px-4 py-8 text-[#15172B] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Top: full-bleed brand + stats */}
        <div className="overflow-hidden rounded-[2rem] border border-[#DCE9FB] bg-white shadow-[0_30px_80px_-40px_rgba(37,99,235,0.25)]">
          <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
            <div className="border-b border-[#DCE9FB] p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <Header />
              <div className="mt-6">
                <WaveformDivider />
              </div>
              <p className="mt-4 max-w-xl text-sm text-[#676C89] sm:text-base">
                Compose a script, scan an image, or pick from your recent takes.
                Voxa turns your text into natural voiceovers with adjustable
                voices and playback controls.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6 sm:p-8">
              <StatPill label="Voices" value={voiceOptions.length || "—"} />
              <StatPill
                label="Recent"
                value={history.length}
              />
              <StatPill
                label="Max length"
                value={`${maxTextLength}`}
              />
              <StatPill
                label="Speed range"
                value={`${minSpeed.toFixed(1)}–${maxSpeed.toFixed(1)}×`}
              />
            </div>
          </div>
        </div>

        {/* Two-pane main area */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* LEFT: studio */}
          <section className="rounded-[2rem] border border-[#DCE9FB] bg-white p-6 shadow-[0_30px_80px_-40px_rgba(37,99,235,0.2)] sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
                  Studio
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#15172B]">
                  Create your voiceover
                </h2>
              </div>
              <ModeToggle mode={inputMode} onChange={setInputMode} />
            </div>

            {inputMode === "script" ? (
              <>
                <ScriptEditor
                  text={text}
                  charCount={charCount}
                  charLimit={maxTextLength}
                  overLimit={overLimit}
                  onTextChange={setText}
                  onUseExample={() => setText(EXAMPLE_TEXT)}
                  onClear={() => setText("")}
                />

                <div className="mt-6 grid gap-5 border-t border-[#DCE9FB] pt-6 sm:grid-cols-[1.4fr_0.8fr]">
                  <VoiceSelect
                    voices={voiceOptions}
                    selectedVoiceId={voiceId}
                    onChange={setVoiceId}
                  />
                  <SpeedControl
                    speed={speed}
                    min={minSpeed}
                    max={maxSpeed}
                    onChange={setSpeed}
                  />
                </div>

                <div className="mt-6">
                  <GenerateButton
                    isGenerating={isGenerating}
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                  />
                  <p className="mt-2 text-center text-xs text-[#676C89]">
                    {configLoaded
                      ? `Generate a natural voiceover between ${minTextLength} and ${maxTextLength} characters.`
                      : "Loading voice configuration…"}
                  </p>
                </div>
              </>
            ) : (
              <OCRSection
                apiUrl={API_URL}
                onUseExtractedText={handleUseExtractedText}
              />
            )}
          </section>

          {/* RIGHT: output */}
          <section className="flex flex-col gap-6">
            <GeneratedFile
              generation={selectedGeneration}
              audioUrl={selectedAudioUrl}
            />
            <GenerationHistory
              items={history}
              selectedFilename={selectedGeneration?.filename}
              onSelect={handleGenerationSelect}
            />
            <GeneratedFilesList
              files={history.map((item) => item.filename)}
              selectedFile={selectedGeneration?.filename}
              onSelect={handleGenerationSelect}
            />
          </section>
        </div>

        <Footer />
      </div>
    </main>
  );
}
