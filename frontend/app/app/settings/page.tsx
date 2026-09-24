"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/auth";
import { loadStudioDefaults, resolveTheme, saveStudioDefaults, setTheme as persistTheme, type ThemeMode, type StudioDefaults } from "../../../lib/theme";
import { voiceName } from "../../../lib/voices";
import { GradientIcon } from "../../../components/Decorative";

type VoiceOption = { id: string; name: string };
type StudioConfig = { minSpeed: number; maxSpeed: number };

type FormatOption = "wav" | "mp3" | "ogg" | "flac";

const FORMATS: FormatOption[] = ["wav", "mp3", "ogg", "flac"];
const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState<ThemeMode>(() => resolveTheme());
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [config, setConfig] = useState<StudioConfig>({ minSpeed: 0.5, maxSpeed: 1.5 });
  const [defaultVoice, setDefaultVoice] = useState(() => loadStudioDefaults().voiceId ?? "");
  const [defaultSpeed, setDefaultSpeed] = useState(() => loadStudioDefaults().speed ?? 1);
  const [defaultFormat, setDefaultFormat] = useState<FormatOption>(() => {
    const f = loadStudioDefaults().format;
    return (FORMATS as string[]).includes(f ?? "") ? (f as FormatOption) : "wav";
  });
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, [supabase]);

  useEffect(() => {
    const stored = loadStudioDefaults();
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/config`)
      .then((r) => r.json())
      .then((d) => {
        setVoices(d.voices || []);
        setConfig({ minSpeed: d.minSpeed ?? 0.5, maxSpeed: d.maxSpeed ?? 1.5 });
        if (!stored.voiceId && d.voices?.[0]?.id) setDefaultVoice(d.voices[0].id);
      })
      .catch(() => {});
  }, []);

  const currentDefaults = useMemo<StudioDefaults>(() => ({ voiceId: defaultVoice, speed: defaultSpeed, format: defaultFormat }), [defaultVoice, defaultSpeed, defaultFormat]);

  function handleThemeChange(next: ThemeMode) {
    setTheme(next);
    persistTheme(next);
  }

  function handleSaveDefaults() {
    saveStudioDefaults(currentDefaults);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <div className="mb-8 flex items-start gap-4">
        <GradientIcon tone="accent" className="h-12 w-12 rounded-2xl">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </GradientIcon>
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">Settings</h1>
          <p className="mt-1 text-[14px] text-muted">Manage your account, appearance, and studio defaults.</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-ink">Appearance</h2>
          <p className="mt-0.5 text-[12px] text-muted">Choose how Voxa looks on this device.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-soft p-1">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleThemeChange(opt.value)}
                  className={`rounded-lg px-4 py-2 text-[12px] font-semibold transition ${
                    theme === opt.value ? "bg-primary text-white shadow-sm" : "text-muted hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-ink">Studio defaults</h2>
          <p className="mt-0.5 text-[12px] text-muted">These are pre-selected each time you open the TTS Studio.</p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold text-muted">Default voice</label>
              <select
                value={defaultVoice}
                onChange={(e) => setDefaultVoice(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-soft px-3 py-2.5 text-[13px] text-ink outline-none transition focus:border-primary"
              >
                {voices.length === 0 && <option value="">No voices available</option>}
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-muted">Default output format</label>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setDefaultFormat(f)}
                    className={`rounded-xl py-2.5 text-[12px] font-semibold uppercase transition ${
                      defaultFormat === f ? "bg-primary text-white shadow-sm" : "bg-soft text-ink hover:bg-primary-100"
                    }`}
                  >
                    {f === "mp3" ? "MP3" : f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-muted">Default speed</label>
              <span className="rounded-lg bg-accent px-2.5 py-1 font-mono text-[11px] font-semibold text-ink">{defaultSpeed.toFixed(2)}&times;</span>
            </div>
            <input
              type="range"
              min={config.minSpeed}
              max={config.maxSpeed}
              step={0.05}
              value={defaultSpeed}
              onChange={(e) => setDefaultSpeed(Number(e.target.value))}
              className="mt-3"
              aria-label="Default speed"
            />
            <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted">
              <span>{config.minSpeed}&times;</span>
              <span>{config.maxSpeed}&times;</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDefaults}
              className="rounded-xl bg-primary px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-primary-strong"
            >
              Save defaults
            </button>
            {saved && <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">Saved.</span>}
            {defaultVoice && <span className="ml-auto text-[11px] text-muted">Voice: {voiceName(defaultVoice, voices)}</span>}
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-ink">Account</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-muted">Email</label>
              <input type="email" readOnly value={email} className="mt-1.5 w-full max-w-md rounded-xl border border-line bg-soft px-4 py-3 text-[13px] text-ink" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-muted">Authentication</label>
              <p className="mt-1.5 text-[13px] text-ink">Supabase Auth</p>
            </div>
            <button type="button" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="rounded-xl border border-line bg-surface px-5 py-2.5 text-[13px] font-semibold text-ink transition hover:border-error hover:text-error">Sign out</button>
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-ink">Application</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["Text-to-Speech", "Voxa", "Local speech synthesis", "var(--success)"],
              ["OCR", "Integrated", "Image text extraction", "var(--primary)"],
              ["Storage", "Supabase Storage", "Bucket: voxa-audio", "#10B981"],
              ["Database", "PostgreSQL", "audio_generations table", "var(--accent)"],
            ].map(([title, name, detail, color]) => (
              <div key={title} className="rounded-xl bg-soft p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">{title}</p>
                <p className="mt-1.5 text-[14px] font-semibold text-ink">{name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="text-[11px] text-muted">{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-ink">Account Status</h2>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[13px] font-medium text-emerald-700 dark:text-emerald-300">Active &mdash; Signed in as {email}</span>
          </div>
        </section>
      </div>
    </>
  );
}