"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AudioPlayer } from "../../components/AudioPlayer";
import { ToastStack, type ToastItem } from "../../components/Toast";
import { SpectrumBars } from "../../components/SpectrumBars";
import { GradientIcon } from "../../components/Decorative";
import { API_URL, apiFetch } from "../../lib/api";
import { voiceName, voiceOptionsFallback } from "../../lib/voices";
import { loadStudioDefaults } from "../../lib/theme";
import type {
  AudioFormat,
  Generation,
  AppConfig,
  Preset,
  BatchItemResult,
  BatchResponse,
  JobInfo,
} from "../../lib/types";

const FORMAT_LABELS: Record<AudioFormat, string> = {
  wav: "WAV",
  mp3: "MP3",
  ogg: "OGG",
  flac: "FLAC",
};

type Mode = "single" | "batch";

const FALLBACK_MAX_WORDS = 800;
const FALLBACK_MAX_CHARS = 4000;

function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
}

// Hard word cap: keep the first `max` words, preserving the original spaces/newlines
// of the retained text and discarding everything past the limit.
function clampToWords(value: string, max: number): string {
  if (max <= 0) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const tokens = trimmed.match(/\S+\s*/g);
  if (!tokens || tokens.length <= max) return value;
  return tokens.slice(0, max).join("").trimEnd();
}

// Hard character cap: catches no-space input that a word count never sees.
function clampToChars(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

// Apply both caps; the char cap runs first so it is always the un-bypassable floor.
function clampText(value: string, maxWords: number, maxChars: number): { text: string; clamped: boolean } {
  const charClamped = clampToChars(value, maxChars);
  const wordClamped = clampToWords(charClamped, maxWords);
  return { text: wordClamped, clamped: charClamped !== value || wordClamped !== charClamped };
}

export default function StudioPage() {
  const searchParams = useSearchParams();
  const [text, setText] = useState<string>(() => clampText(searchParams.get("ocrText") ?? "", FALLBACK_MAX_WORDS, FALLBACK_MAX_CHARS).text);
  const [voiceId, setVoiceId] = useState("");
  const [voiceOptions, setVoiceOptions] = useState<{ id: string; name: string }[]>([]);
  const [speed, setSpeed] = useState(1.0);
  const [format, setFormat] = useState<AudioFormat>("wav");
  const [mode, setMode] = useState<Mode>("single");
  const [batchScripts, setBatchScripts] = useState("");
  const [batchResults, setBatchResults] = useState<BatchItemResult[]>([]);
  const [activeJob, setActiveJob] = useState<JobInfo | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [minTextLength, setMinTextLength] = useState(1);
  const [maxTextWords, setMaxTextWords] = useState(FALLBACK_MAX_WORDS);
  const [maxTextChars, setMaxTextChars] = useState(FALLBACK_MAX_CHARS);
  const [maxBatchItems, setMaxBatchItems] = useState(20);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [playSignal, setPlaySignal] = useState(0);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [clampedNotice, setClampedNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const clampNoticeTimer = useRef<number | undefined>(undefined);

  function showClampNotice() {
    setClampedNotice(`Limited to ${maxTextWords.toLocaleString()} words and ${maxTextChars.toLocaleString()} characters — extra text was removed.`);
    window.clearTimeout(clampNoticeTimer.current);
    clampNoticeTimer.current = window.setTimeout(() => setClampedNotice(null), 4000);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(e.target as Node)) {
        setVoiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const wordCount = countWords(text);
  const charCount = text.length;
  const trimmedLength = text.trim().length;
  const overLimit = wordCount > maxTextWords || charCount > maxTextChars;
  const isGenerating = !!activeJob && (activeJob.status === "queued" || activeJob.status === "running");
  const canGenerate = configLoaded && trimmedLength >= minTextLength && !overLimit && !isGenerating && !!voiceId;

  const batchItems = parseBatch(batchScripts);
  const batchCount = batchItems.length;
  const batchOverLimit = batchCount > maxBatchItems;
  const batchOverWords = batchItems.some((t) => countWords(t) > maxTextWords || t.length > maxTextChars);
  const canBatch = configLoaded && !isGenerating && !!voiceId && batchCount >= 1 && !batchOverLimit && !batchOverWords;

  let validationError: string | null = null;
  if (charCount > maxTextChars) validationError = `Text is over the ${maxTextChars.toLocaleString()}-character limit.`;
  else if (wordCount > maxTextWords) validationError = `Text is over the ${maxTextWords.toLocaleString()}-word limit.`;
  else if (countWords(text) > 0 && trimmedLength === 0) validationError = "Whitespace-only text can\u2019t be spoken.";
  else if (trimmedLength > 0 && trimmedLength < minTextLength) validationError = "Text is too short.";

  function pushToast(tone: "success" | "error", msg: string) {
    const id = Date.now() + Math.random();
    setToasts((c) => [...c, { id, tone, text: msg }]);
    window.setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 4500);
  }
  function dismissToast(id: number) { setToasts((c) => c.filter((t) => t.id !== id)); }

  async function fetchHistory() {
    const res = await apiFetch("/audio");
    const data = await res.json();
    return (data.files || []) as Generation[];
  }
  async function fetchPresets(): Promise<Preset[]> {
    try {
      const res = await apiFetch("/presets");
      const data = await res.json();
      return (data.presets || []) as Preset[];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    let ignore = false;
    const defaults = loadStudioDefaults();
    fetch(`${API_URL}/config`)
      .then((r) => r.json())
      .then((d: AppConfig) => {
        if (ignore) return;
        setVoiceOptions(d.voices);
        setMinTextLength(d.minTextLength);
        setMaxTextWords(d.maxTextWords);
        setMaxTextChars(d.maxTextChars ?? FALLBACK_MAX_CHARS);
        if (d.maxBatchItems) setMaxBatchItems(d.maxBatchItems);
        if (defaults?.voiceId && d.voices.some((v) => v.id === defaults.voiceId)) {
          setVoiceId(defaults.voiceId);
        } else {
          setVoiceId((c) => c || d.voices[0]?.id || "");
        }
        if (typeof defaults?.speed === "number" && defaults.speed >= d.minSpeed && defaults.speed <= d.maxSpeed) {
          setSpeed(defaults.speed);
        }
        if (defaults?.format && (Object.keys(FORMAT_LABELS) as AudioFormat[]).includes(defaults.format as AudioFormat)) {
          setFormat(defaults.format as AudioFormat);
        }
        setConfigLoaded(true);
      })
      .catch(() => {
        if (ignore) return;
        setVoiceOptions(voiceOptionsFallback());
        setVoiceId((c) => c || voiceOptionsFallback()[0]?.id || "");
        setConfigLoaded(true);
        pushToast("error", "Could not reach the backend.");
      });
    fetchHistory().then((items) => {
      if (ignore) return;
      setHistory(items);
      setSelectedGeneration((c) => c || items[0] || null);
    }).catch(() => {});
    fetchPresets().then((p) => {
      if (ignore) return;
      setPresets(p);
    });
    apiFetch("/jobs")
      .then((r) => r.json())
      .then((d: { jobs?: JobInfo[] }) => {
        if (ignore) return;
        const inFlight = (d.jobs || []).find((j) => j.status === "queued" || j.status === "running");
        if (inFlight) setActiveJob(inFlight);
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  async function handleJobFinalize(job: JobInfo) {
    if (job.status === "completed") {
      if (job.kind === "batch") {
        const response = job.results as BatchResponse | null;
        const results = response?.results ?? [];
        setBatchResults(results);
        const okCount = results.filter((r) => r.success).length;
        if (okCount > 0) pushToast("success", `Generated ${okCount} of ${results.length} files.`);
        if (okCount < results.length) {
          pushToast("error", `${results.length - okCount} item${results.length - okCount === 1 ? "" : "s"} failed.`);
          setLastError(`${results.length - okCount} item${results.length - okCount === 1 ? "" : "s"} failed. Check the results below.`);
        }
      } else {
        const single = job.results as { filename?: string; format?: AudioFormat } | null;
        pushToast("success", "Audio generated successfully.");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3500);
        if (single?.filename) {
          try {
            const items = await fetchHistory();
            setHistory(items);
            const gen = items.find((i) => i.filename === single.filename) || items[0] || null;
            setSelectedGeneration(gen);
            if (gen) setPlaySignal((v) => v + 1);
          } catch {}
        }
      }
    } else if (job.status === "failed") {
      const msg = job.error || "Generation failed.";
      setLastError(msg);
      pushToast("error", `Failed \u2014 ${msg}`);
      if (job.kind === "batch") setBatchResults([]);
    }
  }

  useEffect(() => {
    const job = activeJob;
    if (!job) return;
    // Terminal jobs are finalized by the poll callback below.
    if (job.status === "completed" || job.status === "failed") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await apiFetch(`/jobs/${encodeURIComponent(job.id)}`);
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 404) {
            const failed: JobInfo = { ...job, status: "failed", error: "Generation was interrupted and can\u2019t be resumed." };
            setActiveJob(failed);
            handleJobFinalize(failed);
          }
          return;
        }
        const next = (await res.json()) as JobInfo;
        if (cancelled) return;
        setActiveJob(next);
        if (next.status === "completed" || next.status === "failed") {
          handleJobFinalize(next);
        }
      } catch {
        // Transient network error — keep polling.
      }
    };
    const timer = window.setInterval(tick, 3000);
    tick();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.id, activeJob?.status]);

  async function handleGenerate() {
    if (!canGenerate) return;
    setLastError(null);
    setShowSuccess(false);
    try {
      const res = await apiFetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId, speed, format }),
      });
      if (!res.ok) {
        const data = await res.json();
        const msg = data?.detail || "Generation failed.";
        setLastError(msg);
        pushToast("error", `Failed \u2014 ${msg}`);
        return;
      }
      const data = await res.json();
      if (!data?.jobId) throw new Error("Backend did not return a job id.");
      setBatchResults([]);
      setActiveJob({ id: data.jobId, kind: "single", status: "queued", createdAt: "", updatedAt: "" });
    } catch {
      setLastError("Unable to start generation. Please try again.");
      pushToast("error", "Unable to start generation.");
    }
  }

  async function handleBatch() {
    if (!canBatch) return;
    setLastError(null);
    setShowSuccess(false);
    try {
      const items = batchItems.map((t) => ({ text: t, voiceId, speed, format }));
      const res = await apiFetch("/generate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json();
        const msg = data?.detail || "Batch generation failed.";
        setLastError(msg);
        pushToast("error", `Failed \u2014 ${msg}`);
        return;
      }
      const data = await res.json();
      if (!data?.jobId) throw new Error("Backend did not return a job id.");
      setBatchResults([]);
      setActiveJob({ id: data.jobId, kind: "batch", status: "queued", createdAt: "", updatedAt: "" });
    } catch {
      setLastError("Unable to run batch generation.");
      pushToast("error", "Unable to run batch generation.");
    }
  }

  async function handlePreviewVoice(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (previewingVoice) return;
    setPreviewingVoice(id);
    try {
      const res = await fetch(`${API_URL}/preview?voiceId=${encodeURIComponent(id)}&speed=1.0`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }
      const audio = previewAudioRef.current;
      audio.src = url;
      audio.onended = () => setPreviewingVoice(null);
      await audio.play();
    } catch {
      pushToast("error", "Preview unavailable for this voice.");
    } finally {
      window.setTimeout(() => setPreviewingVoice((c) => (c === id ? null : c)), 3000);
    }
  }

  async function handleSavePreset() {
    const name = presetName.trim();
    if (!name) { pushToast("error", "Enter a preset name."); return; }
    try {
      const res = await apiFetch("/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, voiceId, speed, format }),
      });
      if (!res.ok) {
        const d = await res.json();
        pushToast("error", d?.detail || "Failed to save preset.");
        return;
      }
      setPresetName("");
      setShowSavePreset(false);
      setPresets(await fetchPresets());
      pushToast("success", "Preset saved.");
    } catch {
      pushToast("error", "Unable to save preset.");
    }
  }

  async function handleApplyPreset(p: Preset) {
    setVoiceId(p.voiceId);
    setSpeed(p.speed);
    setFormat(p.format);
    pushToast("success", `Applied \u201c${p.name}\u201d.`);
  }

  async function handleDeletePreset(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await apiFetch(`/presets/${id}`, { method: "DELETE" });
      setPresets((c) => c.filter((p) => p.id !== id));
      pushToast("success", "Preset deleted.");
    } catch {
      pushToast("error", "Unable to delete preset.");
    }
  }

  async function handleDownloadSubtitles(gen: Generation) {
    try {
      const res = await apiFetch(`/generate/${encodeURIComponent(gen.filename)}/subtitles`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = gen.filename.replace(/\.[^.]+$/, "") + ".srt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      pushToast("error", "Subtitles unavailable for this file.");
    }
  }

  const audioUrl = selectedGeneration
    ? selectedGeneration.audio_url?.startsWith("http")
      ? selectedGeneration.audio_url
      : `${API_URL}/outputs/${selectedGeneration.filename}`
    : "";

  const selectedVoiceName = voiceName(voiceId, voiceOptions);
  const selectedFormatLabel = FORMAT_LABELS[format];
  const currentPresetApplied = !!presets.find((p) => p.voiceId === voiceId && p.speed === speed && p.format === format);

  return (
    <>
      <div className="mb-8 flex items-start gap-4">
          <GradientIcon className="h-12 w-12 rounded-2xl">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0014 0" />
              <line x1="12" y1="17" x2="12" y2="22" />
            </svg>
          </GradientIcon>
          <div>
            <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">TTS Studio</h1>
            <p className="mt-1 text-[14px] text-muted">Create natural-sounding speech from text &mdash; or extract text from an image first.</p>
          </div>
        </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="min-w-0 rounded-2xl bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Script</h2>
              <p className="mt-0.5 text-[12px] text-muted">Write, paste, or import your text</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-soft p-1">
              {(["single", "batch"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                    mode === m ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-primary"
                  }`}
                >
                  {m === "single" ? "Single" : "Batch"}
                </button>
              ))}
            </div>
          </div>

          {mode === "single" ? (
            <>
              <div className="relative mt-4">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => {
                    const { text: next, clamped } = clampText(e.target.value, maxTextWords, maxTextChars);
                    if (clamped) showClampNotice();
                    setText(next);
                  }}
                  rows={8}
                  placeholder="Enter the text you want Voxa to speak..."
                  wrap="soft"
                  className={`w-full resize-none rounded-xl border bg-soft p-4 text-[14px] leading-relaxed text-ink placeholder:text-faint transition focus:outline-none focus:ring-2 ${
                    overLimit ? "border-red-200 focus:border-red-400 focus:ring-red-100 dark:border-red-800/60 dark:focus:border-red-400 dark:focus:ring-red-900/40" : "border-line focus:border-primary focus:ring-primary/15"
                  }`}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[11px] font-medium ${overLimit ? "text-error" : "text-muted"}`}>
                  {wordCount.toLocaleString()} / {maxTextWords.toLocaleString()} words &middot; {charCount.toLocaleString()} / {maxTextChars.toLocaleString()} chars
                </span>
                {validationError && <span className="text-[11px] font-medium text-error">{validationError}</span>}
              </div>
              {clampedNotice && <p className="mt-1 text-[11px] font-medium text-accent">{clampedNotice}</p>}
            </>
          ) : (
            <>
              <div className="relative mt-4">
                <textarea
                  value={batchScripts}
                  onChange={(e) => {
                    let clamped = false;
                    const next = e.target.value
                      .split(/\n\s*\n/)
                      .map((block) => {
                        const r = clampText(block, maxTextWords, maxTextChars);
                        if (r.clamped) clamped = true;
                        return r.text;
                      })
                      .join("\n\n");
                    if (clamped) showClampNotice();
                    setBatchScripts(next);
                  }}
                  rows={9}
                  wrap="soft"
                  placeholder={"One script per block, separated by a blank line:\n\nWelcome to Voxa.\nSpeak this second line.\n\nA third line here."}
                  className={`w-full resize-none rounded-xl border bg-soft p-4 text-[14px] leading-relaxed text-ink placeholder:text-faint transition focus:outline-none focus:ring-2 ${
                    batchOverLimit || batchOverWords ? "border-red-200 focus:border-red-400 focus:ring-red-100 dark:border-red-800/60 dark:focus:border-red-400 dark:focus:ring-red-900/40" : "border-line focus:border-primary focus:ring-primary/15"
                  }`}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[11px] font-medium ${batchOverLimit || batchOverWords ? "text-error" : "text-muted"}`}>
                  {batchCount} script{batchCount === 1 ? "" : "s"} &middot; up to {maxTextWords.toLocaleString()} words &amp; {maxTextChars.toLocaleString()} chars each &middot; max {maxBatchItems}
                </span>
                {(batchOverLimit || batchOverWords) && (
                  <span className="text-[11px] font-medium text-error">
                    {batchOverLimit ? "Too many scripts for one batch." : "One or more scripts exceed the word or character limit."}
                  </span>
                )}
              </div>
              {clampedNotice && <p className="mt-1 text-[11px] font-medium text-accent">{clampedNotice}</p>}

              {batchResults.length > 0 && !isGenerating && (
                <div className="mt-4 space-y-2 border-t border-line pt-4">
                  {batchResults.map((r) => (
                    <div key={r.index} className="flex min-w-0 items-center gap-3 rounded-xl bg-soft px-4 py-2.5">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        r.success ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300"
                      }`}>
                        {r.success ? "\u2713" : "\u2715"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
                        {r.success ? r.filename : r.error || "Failed"}
                      </span>
                      {r.success && (
                        <span className="rounded bg-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary uppercase">
                          {r.format}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-ink">Voice &amp; language</h3>
              {voiceOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSavePreset((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary transition hover:text-primary-strong"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                  Save as preset
                </button>
              )}
            </div>

            {showSavePreset && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g. Narrator warm"
                  maxLength={60}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-soft px-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-primary-strong"
                >
                  Save
                </button>
              </div>
            )}

            {presets.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    title={`${p.name} \u2014 ${p.voiceId}, ${p.speed}\u00d7, ${p.format.toUpperCase()}`}
                    className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                      p.voiceId === voiceId && p.speed === speed && p.format === format
                        ? "bg-primary text-white"
                        : "bg-soft text-primary hover:bg-primary-100"
                    }`}
                  >
                    <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" /></svg>
                    {p.name}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleDeletePreset(p.id, e)}
                      className="ml-0.5 rounded-full p-0.5 opacity-60 transition hover:bg-white/30 hover:opacity-100"
                      title="Delete preset"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="relative mt-3" ref={voiceDropdownRef}>
              <button
                type="button"
                onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-soft px-4 py-3 text-left transition hover:border-primary-200 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
              >
                <span className={`text-[14px] ${voiceId ? "font-medium text-ink" : "text-faint"}`}>
                  {selectedVoiceName || "Select a voice"}
                </span>
                <svg className={`h-4 w-4 shrink-0 text-muted transition-transform ${voiceDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>

              {voiceDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl bg-surface shadow-lg ring-1 ring-black/5">
                  <div className="border-b border-line p-2">
                    <input
                      type="text"
                      value={voiceSearch}
                      onChange={(e) => setVoiceSearch(e.target.value)}
                      placeholder="Search voices..."
                      className="w-full rounded-lg border border-line bg-soft px-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-primary"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[240px] overflow-y-auto p-1">
                    {voiceOptions
                      .filter((v) => {
                        const q = voiceSearch.toLowerCase();
                        return !q || v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
                      })
                      .map((v) => {
                        const sel = v.id === voiceId;
                        return (
                          <div
                            key={v.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => { setVoiceId(v.id); setVoiceDropdownOpen(false); setVoiceSearch(""); }}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setVoiceId(v.id); setVoiceDropdownOpen(false); setVoiceSearch(""); } }}
                            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                              sel ? "bg-soft font-semibold text-primary" : "text-ink hover:bg-soft"
                            }`}
                          >
                            <SpectrumBars size="sm" className={sel ? "text-primary" : "text-primary-200"} />
                            <span className="flex-1">{v.name}</span>
                            <button
                              type="button"
                              onClick={(e) => handlePreviewVoice(v.id, e)}
                              title="Preview this voice"
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                                previewingVoice === v.id ? "bg-primary text-white" : "bg-soft text-primary hover:bg-primary-100"
                              }`}
                            >
                              {previewingVoice === v.id ? (
                                <SpectrumBars size="sm" heights={[4, 8, 5, 10, 4]} animate className="text-white" />
                              ) : (
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                              )}
                            </button>
                            {sel && (
                              <svg className="h-3.5 w-3.5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                          </div>
                        );
                      })}
                    {voiceOptions.filter((v) => {
                      const q = voiceSearch.toLowerCase();
                      return !q || v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
                    }).length === 0 && (
                      <p className="px-3 py-4 text-center text-[12px] text-faint">No voices match your search.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Link href="/app/ocr" className="mt-5 flex items-center gap-2 rounded-xl bg-soft px-4 py-3 text-[12px] font-semibold text-muted transition hover:bg-primary-100 hover:text-primary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3" /><path d="M16 3h-8v4" /></svg>
            Extract text from image &rarr;
          </Link>
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-2xl bg-surface p-6 shadow-sm">
            <h2 className="text-[15px] font-semibold text-ink">Generation settings</h2>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-ink">Speed</label>
                <span className="rounded-lg bg-accent px-2.5 py-1 font-mono text-[11px] font-semibold text-ink">{speed.toFixed(2)}&times;</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={speed}
                disabled={isGenerating}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="mt-3 disabled:opacity-50"
                aria-label="Speed"
              />
              <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted">
                <span>0.5&times;</span>
                <span>Normal</span>
                <span>1.5&times;</span>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <label className="text-[12px] font-semibold text-ink">Output format</label>
              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {(Object.keys(FORMAT_LABELS) as AudioFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    disabled={isGenerating}
                    className={`rounded-xl py-2.5 text-[12px] font-semibold uppercase transition ${
                      f === format ? "bg-primary text-white shadow-sm" : "bg-soft text-ink hover:bg-primary-100"
                    } disabled:opacity-50`}
                  >
                    {FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">Local + Supabase cloud &middot; subtitles auto-generated</p>
            </div>

            <button
              type="button"
              onClick={mode === "batch" ? handleBatch : handleGenerate}
              disabled={mode === "batch" ? !canBatch : !canGenerate}
              className={`mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-[14px] font-semibold transition ${
                isGenerating ? "cursor-wait bg-primary text-white opacity-80"
                  : (mode === "batch" ? !canBatch : !canGenerate) ? "cursor-not-allowed bg-primary-200 text-muted"
                  : "bg-gradient-to-r from-primary to-primary-strong text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] hover:brightness-110 hover:shadow-[0_10px_30px_-6px_rgba(37,99,235,0.7)] active:scale-[0.99]"
              }`}
            >
              {isGenerating ? (
                <>
                  <SpectrumBars size="sm" heights={[4, 8, 5, 10, 4]} animate className="text-white" />
                  {mode === "batch" ? "Generating batch&hellip;" : "Generating&hellip;"}
                </>
              ) : (
                <>
                  <SpectrumBars size="sm" className="text-white" />
                  {mode === "batch" ? "Generate batch" : "Generate speech"}
                </>
              )}
            </button>

            {currentPresetApplied && (
              <p className="mt-2 text-center text-[11px] font-medium text-primary">This combination matches a saved preset.</p>
            )}
          </section>

          {isGenerating && (
            <section className="rounded-2xl bg-soft p-5 ring-1 ring-primary/10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary">
                  <SpectrumBars size="md" animate className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink">
                    {activeJob?.kind === "batch" ? "Generating batch&hellip;" : "Generating audio&hellip;"}
                  </p>
                  <p className="text-[12px] text-muted">Voxa is working in the background &mdash; you can navigate away or reload this page and it will keep going.</p>
                </div>
              </div>
            </section>
          )}

          {lastError && !isGenerating && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800/50 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                  <svg className="h-5 w-5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="break-words text-[13px] font-medium text-red-700 dark:text-red-300">{lastError}</p>
                  <button type="button" onClick={mode === "batch" ? handleBatch : handleGenerate} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-error transition hover:text-red-700 dark:hover:text-red-400">
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
            <section className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-emerald-700 dark:text-emerald-300">Audio generated successfully</p>
              </div>
            </section>
          )}

          {selectedGeneration && (
            <section className="rounded-2xl bg-surface p-6 shadow-sm">
              <h2 className="mb-4 text-[15px] font-semibold text-ink">Playback</h2>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">{voiceName(selectedGeneration.voice, voiceOptions)}</span>
                <span className="rounded-lg bg-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-primary">{selectedGeneration.speed.toFixed(2)}&times;</span>
                <span className="rounded-lg bg-soft px-2.5 py-1 font-mono text-[11px] font-semibold uppercase text-primary">{selectedGeneration.format || "wav"}</span>
              </div>
              {selectedGeneration.text && <p className="mb-3 text-[13px] leading-relaxed text-ink line-clamp-2 break-words">{selectedGeneration.text}</p>}
              <AudioPlayer
                src={audioUrl}
                autoPlay={playSignal > 0}
                playKey={playSignal}
                subtitlesPath={selectedGeneration.has_subtitles ? `/generate/${encodeURIComponent(selectedGeneration.filename)}/subtitles` : undefined}
              />
              <div className="mt-3 flex gap-2">
                <a href={audioUrl} download={selectedGeneration.filename} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-deep py-2.5 text-[13px] font-semibold text-white transition hover:bg-deep dark:bg-primary dark:hover:bg-primary-strong">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download {selectedFormatLabel}
                </a>
                {selectedGeneration.has_subtitles && (
                  <button
                    type="button"
                    onClick={() => handleDownloadSubtitles(selectedGeneration)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-soft px-4 py-2.5 text-[13px] font-semibold text-primary transition hover:bg-primary-100"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="10" y1="13" x2="14" y2="13" /><line x1="10" y1="17" x2="14" y2="17" /><line x1="8" y1="13" x2="6" y2="13" /><line x1="8" y1="17" x2="6" y2="17" /></svg>
                    SRT
                  </button>
                )}
                <Link href={`/app/history/${encodeURIComponent(selectedGeneration.filename)}`} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-primary hover:text-primary">
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
            <h2 className="text-[15px] font-semibold text-ink">Recent generations</h2>
            <Link href="/app/history" className="text-[12px] font-semibold text-primary transition hover:text-primary-strong">View history &rarr;</Link>
          </div>
          <div className="space-y-2.5">
            {history.slice(0, 3).map((item) => {
              const dl = item.audio_url?.startsWith("http") ? item.audio_url : `${API_URL}/outputs/${item.filename}`;
              return (
                <div key={item.filename} className="flex items-center gap-4 rounded-2xl bg-surface px-5 py-3.5 shadow-sm transition hover:shadow-md">
                  <GradientIcon className="h-10 w-10 rounded-xl">
                    <SpectrumBars size="sm" className="text-white" />
                  </GradientIcon>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{item.text ? (item.text.length > 40 ? item.text.slice(0, 40) + "\u2026" : item.text) : "Untitled"}</p>
                    <p className="text-[11px] text-muted">{voiceName(item.voice, voiceOptions)} &middot; {item.speed}&times; &middot; <span className="uppercase">{item.format || "wav"}</span></p>
                  </div>
                  <button type="button" onClick={() => { setSelectedGeneration(item); setPlaySignal((v) => v + 1); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-strong" title="Play">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                  <a href={dl} download={item.filename} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft text-primary transition hover:bg-primary-100" title="Download">
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

function parseBatch(input: string): string[] {
  return input
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}