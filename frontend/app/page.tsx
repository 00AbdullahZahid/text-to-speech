"use client";

import { useState } from "react";
import Link from "next/link";

const NAVY = "#0B1739";
const BLUE = "#2563EB";
const White = "#ffffff";
const BLUE_LIGHT = "#EFF6FF";
const DARK_TEXT = "#0F172A";

const FEATURES = [
  {
    title: "AI Text-to-Speech",
    desc: "Turn scripts, notes, and content into natural-sounding WAV audio.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    title: "Image OCR",
    desc: "Extract text from images with Qwen2.5-VL and send it straight to TTS.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="13" r="3" />
        <path d="M16 3h-8v4" />
      </svg>
    ),
  },
  {
    title: "8 Languages",
    desc: "Create speech across Afrikaans, English, Spanish, Hindi, French, Japanese, Portuguese, and Chinese.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    title: "Generation History",
    desc: "Play, download, review, or delete previous generations whenever you need them.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    num: "01",
    title: "Write or extract",
    desc: "Enter your script or upload an image to extract text.",
  },
  {
    num: "02",
    title: "Choose your voice",
    desc: "Select a language, voice, and speaking speed.",
  },
  {
    num: "03",
    title: "Generate & listen",
    desc: "Voxa\u2019s AI creates your WAV audio for playback and download.",
  },
];

const LANGUAGES = [
  { name: "English", flag: "🇬🇧" },
  { name: "Spanish", flag: "🇪🇸" },
  { name: "French", flag: "🇫🇷" },
  { name: "Hindi", flag: "🇮🇳" },
  { name: "Japanese", flag: "🇯🇵" },
  { name: "Portuguese", flag: "🇵🇹" },
  { name: "Chinese", flag: "🇨🇳" },
  { name: "Afrikaans", flag: "🇿🇦" },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <header className="fixed top-4 z-50 w-full px-4">
        <div
          className="mx-auto max-w-6xl rounded-2xl shadow-lg"
          style={{ backgroundColor: NAVY }}
        >
          <div className="flex h-16 items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: BLUE }}>
                <span className="text-sm font-bold text-white">V</span>
              </div>
              <span className="font-display text-lg font-bold text-white">Voxa</span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-[13px] font-medium text-white/70 transition hover:text-white">Features</a>
              <a href="#how-it-works" className="text-[13px] font-medium text-white/70 transition hover:text-white">How it works</a>
              <a href="#languages" className="text-[13px] font-medium text-white/70 transition hover:text-white">Languages</a>
            </nav>

            <div className="hidden items-center gap-4 md:flex">
              <Link href="/login" className="text-[13px] font-medium text-white/70 transition hover:text-white">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: BLUE }}
              >
                Get started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile dropdown panel */}
          <div
            className={`overflow-hidden transition-all duration-300 md:hidden ${
              mobileOpen ? "max-h-64 border-t border-white/10" : "max-h-0"
            }`}
          >
            <nav className="flex flex-col gap-1 px-6 py-4">
              <a
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                How it works
              </a>
              <a
                href="#languages"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Languages
              </a>
              <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-4">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-center text-[14px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-center text-[14px] font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: BLUE }}
                >
                  Get started
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 bg-blue-800">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-4 text-right text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: White }}>
            AI Text-to-Speech
          </p>

          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-[#ffffff] sm:text-5xl lg:text-[56px]">
            Turn your words into natural voice.
          </h1>

          <p className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-medium text-[#EFF6FF]">
            <span>English</span>
            <span className="text-gray-300">&middot;</span>
            <span>WAV output</span>
            <span className="text-gray-300">&middot;</span>
            <span>Cloud storage</span>
          </p>

          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-[#EFF6FF]">
            Voxa transforms text into natural-sounding speech with AI &mdash; and lets you extract text from images before turning it into voice.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-[14px] font-semibold text-white transition hover:opacity-90 bg-blue-500"
            >
              Start creating
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-7 py-3.5 text-[14px] font-semibold text-[#0F172A] transition hover:bg-gray-50"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ──────────────────────────────────────── */}
      <div className="border-y border-gray-100 bg-blue-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <p className="text-[13px] font-semibold text-[#0F172A]">
            Built for creators, developers, educators, and teams.
          </p>
          <p className="text-[13px] text-[#0F172A]">
            Natural voice generation without a complicated workflow.
          </p>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="font-display text-[28px] font-bold tracking-tight text-[#0F172A] sm:text-[32px]">
              Everything you need to create voice
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#64748B]">
              A simple workflow for generating speech and turning images into usable text.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[10px] border border-gray-200 bg-white p-6 transition hover:shadow-md"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}
                >
                  {f.icon}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-[#0F172A]">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-gray-100 bg-blue-100 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-[28px] font-bold tracking-tight text-[#0F172A] sm:text-[32px]">
            How Voxa works
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="rounded-[10px] bg-blue-50 p-6"
              >
                <span
                  className="inline-block rounded-md px-2.5 py-1 text-[12px] font-bold"
                  style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}
                >
                  {s.num}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-[#0F172A]">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section className="bg-blue-100 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div
            className="flex flex-col items-center justify-between gap-8 rounded-2xl px-8 py-14 sm:px-12 lg:flex-row lg:px-16"
            style={{ backgroundColor: NAVY }}
          >
            <div className="max-w-lg text-center lg:text-left">
              <h2 className="font-display text-[26px] font-bold tracking-tight text-white sm:text-[30px]">
                Ready to turn words into voice?
              </h2>
              <p className="mt-3 text-[15px] text-gray-400">
                Create your first AI-generated voice with Voxa.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-7 py-3.5 text-[14px] font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              Get started
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
            {/* Left: brand */}
            <div>
              <Link href="/" className="flex items-center gap-2">
                <svg className="h-7 w-7" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="7" fill={BLUE} />
                  <path
                    d="M8 8l5 12h1.4L19.4 8h-2.6l-3.3 8.2L10.2 8H8z"
                    fill="white"
                  />
                  <path
                    d="M14.9 20L20 8h-2.6l-3.6 8.6.6 1.4h.5z"
                    fill="white"
                    opacity="0.5"
                  />
                </svg>
                <span className="font-display text-lg font-bold text-white">Voxa</span>
              </Link>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-gray-400">
                Voxa transforms text into natural-sounding speech with AI &mdash; and lets you extract text from images before turning it into voice.
              </p>
            </div>

            {/* Right: link columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Product</h4>
                <ul className="mt-4 space-y-2.5">
                  {["TTS Studio", "Image OCR", "Generation History", "Languages"].map((item) => (
                    <li key={item}>
                      <Link href="/app" className="text-[13px] text-gray-400 transition hover:text-white">{item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Company</h4>
                <ul className="mt-4 space-y-2.5">
                  {["About", "Blog", "Careers", "Contact"].map((item) => (
                    <li key={item}>
                      <span className="text-[13px] text-gray-400 transition hover:text-white cursor-pointer">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Resources</h4>
                <ul className="mt-4 space-y-2.5">
                  {["Documentation", "API Reference", "Community", "Support"].map((item) => (
                    <li key={item}>
                      <span className="text-[13px] text-gray-400 transition hover:text-white cursor-pointer">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-[12px] text-gray-500">&copy; 2026 Voxa. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {/* X / Twitter */}
              <a href="#" className="text-gray-500 transition hover:text-white" aria-label="X / Twitter">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="text-gray-500 transition hover:text-white" aria-label="LinkedIn">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              {/* GitHub */}
              <a href="#" className="text-gray-500 transition hover:text-white" aria-label="GitHub">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}