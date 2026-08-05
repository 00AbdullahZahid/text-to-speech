"use client";

import { useEffect, useState } from "react";
import { ScriptEditor } from "../components/ScriptEditor";
import { VoiceSelect } from "../components/VoiceSelect";
import { SpeedControl } from "../components/SpeedControl";
import { GenerateButton } from "../components/GenerateButton";
import { GeneratedFile } from "../components/GeneratedFile";
import { GenerationHistory, type Generation } from "../components/GenerationHistory";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

/**
 * Voxa — AI Text-to-Speech (simplified)
 * Single-file page.tsx (Next.js App Router)
 *
 * UI only — wire `handleGenerate` up to your own API.
 *
 * Design tokens (light theme):
 *   bg        #F6F5FB   soft lavender-white
 *   card      #FFFFFF
 *   ink       #15172B
 *   ink-muted #676C89
 *   border    #E7E5F3
 *   accent    #3B2FD4   electric indigo
 *   accent-soft #EDEBFC
 *   amber     #FF8A3D   waveform / generate accent
 *
 * Type: Space Grotesk (display), Inter (body), IBM Plex Mono (data/utility)
 * For production, move the font import into a next/font/google call in
 * layout.tsx instead of the runtime @import below.
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
const WAVE_HEIGHTS = [6, 14, 9, 22, 16, 28, 12, 20, 8, 24, 15, 10, 18, 7, 13, 21, 9, 16, 6, 11];

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
            backgroundColor: i % 3 === 0 ? "#FF8A3D" : "#3B2FD4",
            opacity: i % 3 === 0 ? 0.85 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

export default function Page() {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [speed, setSpeed] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);
  const [minTextLength, setMinTextLength] = useState(1);
  const [maxTextLength, setMaxTextLength] = useState(800);
  const [minSpeed, setMinSpeed] = useState(0.5);
  const [maxSpeed, setMaxSpeed] = useState(1.5);
  const [configLoaded, setConfigLoaded] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const selectedAudioUrl = selectedGeneration ? `${API_URL}/outputs/${selectedGeneration.filename}` : "";

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

  return (
    <main className="min-h-screen bg-[#F6F5FB] px-4 py-12 text-[#15172B] sm:px-6">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-[#E7E5F3] bg-white p-6 shadow-[0_30px_80px_-40px_rgba(59,47,212,0.25)] sm:p-10 font-body">
        <div className="mt-6 rounded-[2rem] border border-[#E7E5F3] bg-[#F8F9FF] p-6 shadow-[0_20px_50px_-35px_rgba(59,47,212,0.25)]">
          <Header />
        </div>
        <div className="my-8">
          <WaveformDivider />
        </div>

        <ScriptEditor
          text={text}
          charCount={charCount}
          charLimit={maxTextLength}
          overLimit={overLimit}
          onTextChange={setText}
          onUseExample={() => setText(EXAMPLE_TEXT)}
          onClear={() => setText("")}
        />

        <div className="mt-8 grid gap-4 border-t border-[#E7E5F3] pt-8 md:grid-cols-[1.4fr_0.6fr]">
          <VoiceSelect voices={voiceOptions} selectedVoiceId={voiceId} onChange={setVoiceId} />
          <SpeedControl speed={speed} min={minSpeed} max={maxSpeed} onChange={setSpeed} />
        </div>

        <div className="mt-6">
          <GenerateButton
            isGenerating={isGenerating}
            disabled={!canGenerate}
            onClick={handleGenerate}
          />
        </div>

        <GeneratedFile generation={selectedGeneration} audioUrl={selectedAudioUrl} />
        <GenerationHistory
          items={history}
          selectedFilename={selectedGeneration?.filename}
          onSelect={handleGenerationSelect}
        />
      </div>
      <Footer />
    </main>
  );
}