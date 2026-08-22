"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AudioPlayer } from "../../components/AudioPlayer";
import { ToastStack, type ToastItem } from "../../components/Toast";
import { SpectrumBars } from "../../components/SpectrumBars";
import { API_URL, apiFetch } from "../../lib/api";

type VoiceOption = { id: string; name: string };
type Generation = {
  filename: string;
  voice: string;
  voiceId?: string;
  speed: number;
  text: string;
  size: number;
  created_at: string;
  storage_path?: string;
  audio_url?: string;
};
type AppConfig = {
  voices: VoiceOption[];
  minTextLength: number;
  maxTextLength: number;
  minSpeed: number;
  maxSpeed: number;
};

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export default function StudioPage() {
  const searchParams = useSearchParams();
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [minTextLength, setMinTextLength] = useState(1);
  const [maxTextLength, setMaxTextLength] = useState(800);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [playSignal, setPlaySignal] = useState(0);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(e.target as Node)) {
        setVoiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const charCount = text.length;
  const trimmedLength = text.trim().length;
  const overLimit = charCount > maxTextLength;
  const canGenerate = configLoaded && trimmedLength >= minTextLength && !overLimit && !isGenerating && !!voiceId;

  let validationError: string | null = null;
  if (overLimit) validationError = `Text is over the ${maxTextLength}-character limit.`;
  else if (charCount > 0 && trimmedLength === 0) validationError = "Whitespace-only text can\u2019t be spoken.";
  else if (trimmedLength > 0 && trimmedLength < minTextLength) validationError = "Text is too short.";

  function pushToast(tone: "success" | "error", msg: string) {
    const id = Date.now() + Math.random();
    setToasts((c) => [...c, { id, tone, text: msg }]);
    window.setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 4500);
  }
  function dismissToast(id: number) { setToasts((c) => c.filter((t) => t.id !== id)); }

  async function fetchConfig() {
    const res = await fetch(`${API_URL}/config`);
    return (await res.json()) as AppConfig;
  }
  async function fetchHistory() {
    const res = await apiFetch("/audio");
    const data = await res.json();
    return (data.files || []) as Generation[];
  }

  useEffect(() => {
    let ignore = false;
    const ocrText = searchParams.get("ocrText");
    if (ocrText) { setText(ocrText); }
    fetchConfig().then((d) => {
      if (ignore) return;
      setVoiceOptions(d.voices);
      setMinTextLength(d.minTextLength);
      setMaxTextLength(d.maxTextLength);
      setVoiceId((c) => c || d.voices[0]?.id || "");
      setConfigLoaded(true);
    }).catch(() => { if (!ignore) pushToast("error", "Could not reach the backend."); });
    fetchHistory().then((items) => {
      if (ignore) return;
      setHistory(items);
      setSelectedGeneration((c) => c || items[0] || null);
    }).catch(() => {});
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    if (!canGenerate) return;
    setIsGenerating(true);
    setLastError(null);
    setShowSuccess(false);
    try {
      const res = await apiFetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId, speed }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.detail || "Generation failed.";
        setLastError(msg);
        pushToast("error", `Failed \u2014 ${msg}`);
        return;
      }
      const items = await fetchHistory();
      setHistory(items);
      const gen = items.find((i) => i.filename === data.filename) || items[0] || null;
      setSelectedGeneration(gen);
      if (gen) setPlaySignal((v) => v + 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
      pushToast("success", "Audio generated successfully.");
    } catch {
      setLastError("Unable to generate audio. Please try again.");
      pushToast("error", "Unable to generate audio.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDelete(filename: string) {
    try {
      const res = await apiFetch(`/audio/${encodeURIComponent(filename)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const remaining = history.filter((i) => i.filename !== filename);
      setHistory(remaining);
      if (selectedGeneration?.filename === filename) setSelectedGeneration(remaining[0] ?? null);
      pushToast("success", "Generation deleted.");
    } catch {
      pushToast("error", "Something went wrong.");
    }
  }

  const audioUrl = selectedGeneration
    ? selectedGeneration.audio_url?.startsWith("http")
      ? selectedGeneration.audio_url
      : `${API_URL}/outputs/${selectedGeneration.filename}`
    : "";

  const selectedVoiceName = voiceOptions.find((v) => v.id === voiceId)?.name || "";

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight text-[#110D2A]">TTS Studio</h1>
          <p className="mt-1 text-[14px] text-[#64748B]">Create natural-sounding speech from text &mdash; or extract text from an image first.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#F5F3FF] px-4 py-2 text-[11px] font-semibold text-[#7C5CFC] shadow-sm ring-1 ring-[#7C5CFC]/15">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </span>
          Supabase connected
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#110D2A]">Script</h2>
          <p className="mt-0.5 text-[12px] text-[#64748B]">Write, paste, or import your text</p>

          <div className="relative mt-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Enter the text you want Voxa to speak..."
              className={`w-full resize-none rounded-xl border bg-[#F5F3FF] p-4 pr-20 text-[14px] leading-relaxed text-[#110D2A] placeholder:text-[#94A3B8] transition focus:outline-none focus:ring-2 ${
                overLimit ? "border-red-200 focus:border-red-400 focus:ring-red-100" : "border-[#E2E8F0] focus:border-[#7C5CFC] focus:ring-[#7C5CFC]/15"
              }`}
            />
            <button type="button" className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-[#7C5CFC] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#6A4DE6]">
              <span className="text-[10px]">&#10022;</span> AI assist
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className={`text-[11px] font-medium ${overLimit ? "text-[#FF6B6B]" : "text-[#64748B]"}`}>
              {charCount} / {maxTextLength.toLocaleString()} characters
            </span>
            {validationError && <span className="text-[11px] font-medium text-[#FF6B6B]">{validationError}</span>}
          </div>

          <div className="mt-6 border-t border-[#E2E8F0] pt-5">
            <h3 className="text-[13px] font-semibold text-[#110D2A]">Voice &amp; language</h3>
            <div className="relative mt-3" ref={voiceDropdownRef}>
              <button
                type="button"
                onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F3FF] px-4 py-3 text-left transition hover:border-[#C4B5FD] focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/15 focus:outline-none"
              >
                <span className={`text-[14px] ${voiceId ? "font-medium text-[#110D2A]" : "text-[#94A3B8]"}`}>
                  {selectedVoiceName || "Select a voice"}
                </span>
                <svg className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform ${voiceDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>

              {voiceDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                  <div className="border-b border-[#E2E8F0] p-2">
                    <input
                      type="text"
                      value={voiceSearch}
                      onChange={(e) => setVoiceSearch(e.target.value)}
                      placeholder="Search voices..."
                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F5F3FF] px-3 py-2 text-[13px] text-[#110D2A] placeholder:text-[#94A3B8] outline-none focus:border-[#7C5CFC]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[220px] overflow-y-auto p-1">
                    {voiceOptions
                      .filter((v) => {
                        const q = voiceSearch.toLowerCase();
                        return !q || v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
                      })
                      .map((v) => {
                        const sel = v.id === voiceId;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => { setVoiceId(v.id); setVoiceDropdownOpen(false); setVoiceSearch(""); }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                              sel ? "bg-[#F5F3FF] font-semibold text-[#7C5CFC]" : "text-[#110D2A] hover:bg-[#F5F3FF]"
                            }`}
                          >
                            <SpectrumBars size="sm" className={sel ? "text-[#7C5CFC]" : "text-[#C4B5FD]"} />
                            {v.name}
                            {sel && (
                              <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-[#7C5CFC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                          </button>
                        );
                      })}
                    {voiceOptions.filter((v) => {
                      const q = voiceSearch.toLowerCase();
                      return !q || v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
                    }).length === 0 && (
                      <p className="px-3 py-4 text-center text-[12px] text-[#94A3B8]">No voices match your search.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Link href="/app/ocr" className="mt-5 flex items-center gap-2 rounded-xl bg-[#F5F3FF] px-4 py-3 text-[12px] font-semibold text-[#64748B] transition hover:bg-[#EDE9FE] hover:text-[#7C5CFC]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3" /><path d="M16 3h-8v4" /></svg>
            Extract text from image &rarr;
          </Link>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-[15px] font-semibold text-[#110D2A]">Generation settings</h2>

            <div className="mt-5">
              <label className="text-[12px] font-semibold text-[#110D2A]">Speed</label>
              <div className="mt-2.5 grid grid-cols-6 gap-1.5">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    disabled={isGenerating}
                    className={`rounded-xl py-2.5 text-[12px] font-semibold transition ${
                      s === speed ? "bg-[#F0C244] text-[#110D2A] shadow-sm" : "bg-[#F5F3FF] text-[#110D2A] hover:bg-[#EDE9FE]"
                    } disabled:opacity-50`}
                  >
                    {s}&times;
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-[#E2E8F0] pt-5">
              <label className="text-[12px] font-semibold text-[#110D2A]">Output</label>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-lg bg-[#F5F3FF] px-3 py-1.5 text-[13px] font-semibold text-[#7C5CFC]">WAV audio</span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#64748B]">Local + Supabase cloud</p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-[14px] font-semibold transition ${
                isGenerating ? "cursor-wait bg-[#7C5CFC] text-white opacity-80"
                  : !canGenerate ? "cursor-not-allowed bg-[#D4D0E8] text-[#9B95C9]"
                  : "bg-[#7C5CFC] text-white shadow-[0_8px_24px_-6px_rgba(124,92,252,0.5)] hover:bg-[#6A4DE6] active:scale-[0.99]"
              }`}
            >
              {isGenerating ? (
                <>
                  <SpectrumBars size="sm" heights={[4, 8, 5, 10, 4]} animate className="text-white" />
                  Generating&hellip;
                </>
              ) : (
                <>
                  <SpectrumBars size="sm" className="text-white" />
                  Generate speech
                </>
              )}
            </button>
          </section>

          {isGenerating && (
            <section className="rounded-2xl bg-[#F5F3FF] p-5 ring-1 ring-[#7C5CFC]/10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7C5CFC]">
                  <SpectrumBars size="md" animate className="text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#110D2A]">Generating audio&hellip;</p>
                  <p className="text-[12px] text-[#64748B]">Kokoro-82M is generating your audio&hellip;</p>
                </div>
              </div>
            </section>
          )}

          {lastError && !isGenerating && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-5 w-5 text-[#FF6B6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-red-700">{lastError}</p>
                  <button type="button" onClick={handleGenerate} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#FF6B6B] transition hover:text-red-700">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4v6h6" />
                      <path d="M23 20v-6h-6" />
                      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                    </svg>
                    Try again
                  </button>
                </div>
              </div>
            </section>
          )}

          {showSuccess && !isGenerating && (
            <section className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-emerald-700">Audio generated successfully</p>
              </div>
            </section>
          )}

          {selectedGeneration && (
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-[15px] font-semibold text-[#110D2A]">Playback</h2>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-lg bg-[#7C5CFC] px-2.5 py-1 text-[11px] font-semibold text-white">{selectedGeneration.voice}</span>
                <span className="rounded-lg bg-[#F5F3FF] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#7C5CFC]">{selectedGeneration.speed.toFixed(2)}&times;</span>
              </div>
              {selectedGeneration.text && <p className="mb-3 text-[13px] leading-relaxed text-[#110D2A] line-clamp-2">{selectedGeneration.text}</p>}
              <AudioPlayer src={audioUrl} autoPlay={playSignal > 0} playKey={playSignal} />
              <div className="mt-3 flex gap-2">
                <a href={audioUrl} download={selectedGeneration.filename} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#110D2A] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1E1933]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download WAV
                </a>
                <Link href={`/app/history/${encodeURIComponent(selectedGeneration.filename)}`} className="flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#110D2A] transition hover:border-[#7C5CFC] hover:text-[#7C5CFC]">
                  Details
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#110D2A]">Recent generations</h2>
            <Link href="/app/history" className="text-[12px] font-semibold text-[#7C5CFC] transition hover:text-[#6A4DE6]">View history &rarr;</Link>
          </div>
          <div className="space-y-2.5">
            {history.slice(0, 3).map((item) => {
              const dl = item.audio_url?.startsWith("http") ? item.audio_url : `${API_URL}/outputs/${item.filename}`;
              return (
                <div key={item.filename} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-3.5 shadow-sm transition hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C5CFC]">
                    <SpectrumBars size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#110D2A]">{item.text ? (item.text.length > 40 ? item.text.slice(0, 40) + "\u2026" : item.text) : "Untitled"}</p>
                    <p className="text-[11px] text-[#64748B]">{item.voice} &middot; {item.speed}&times;</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedGeneration(item); setPlaySignal((v) => v + 1); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7C5CFC] text-white transition hover:bg-[#6A4DE6]" title="Play">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                  <a href={dl} download={item.filename} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7C5CFC] transition hover:bg-[#EDE9FE]" title="Download">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
