"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/auth";
import { SpectrumBars } from "../../../components/SpectrumBars";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, [supabase]);

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-[24px] font-bold tracking-tight text-[#0B1739]">Settings</h1>
        <p className="mt-1 text-[14px] text-[#64748B]">Manage your account and view application info.</p>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#0B1739]">Account</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#64748B]">Email</label>
              <input type="email" readOnly value={email} className="mt-1.5 w-full max-w-md rounded-xl border border-[#E2E8F0] bg-[#EFF6FF] px-4 py-3 text-[13px] text-[#0B1739]" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#64748B]">Authentication</label>
              <p className="mt-1.5 text-[13px] text-[#0B1739]">Supabase Auth</p>
            </div>
            <button type="button" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#0B1739] transition hover:border-[#FF6B6B] hover:text-[#FF6B6B]">Sign out</button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#0B1739]">Application</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["TTS Engine", "Kokoro-82M", "CPU-only local inference", "#2563EB"],
              ["OCR Engine", "Qwen2.5-VL-3B-Instruct", "HuggingFace Transformers", "#2563EB"],
              ["Storage", "Supabase Storage", "Bucket: voxa-audio", "#10B981"],
              ["Database", "PostgreSQL", "audio_generations table", "#F0C244"],
            ].map(([title, name, detail, color]) => (
              <div key={title} className="rounded-xl bg-[#EFF6FF] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748B]">{title}</p>
                <p className="mt-1.5 text-[14px] font-semibold text-[#0B1739]">{name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="text-[11px] text-[#64748B]">{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#0B1739]">Account Status</h2>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[13px] font-medium text-emerald-700">Active &mdash; Signed in as {email}</span>
          </div>
        </section>
      </div>
    </>
  );
}
