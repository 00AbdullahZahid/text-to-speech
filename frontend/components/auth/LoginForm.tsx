"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/auth";
import { SpectrumBars } from "../SpectrumBars";

type View = "login" | "forgot" | "reset-sent";

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-deep lg:flex lg:w-[45%] lg:items-center lg:justify-center">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div className="relative z-10 flex flex-col items-center px-12 text-center">
        <SpectrumBars size="xl" animate className="text-primary mb-10" />
        <h2 className="font-display text-[32px] font-bold leading-tight text-white">Turn words<br />into voice.</h2>
        <p className="mt-4 max-w-[280px] text-[15px] leading-relaxed text-white/50">AI-powered text-to-speech that sounds natural. Create voiceovers in seconds.</p>
      </div>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/app");
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!resetEmail) { setError("Please enter your email address."); return; }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (resetError) { setError(resetError.message); setLoading(false); return; }
    setView("reset-sent");
    setLoading(false);
  }

  if (view === "reset-sent") {
    return (
      <div className="flex min-h-screen">
        <BrandPanel />
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            <Link href="/" className="inline-flex items-center gap-2.5 lg:hidden mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary">
                <span className="font-display text-base font-bold text-white">V</span>
              </div>
              <span className="font-display text-xl font-bold text-ink">Voxa</span>
            </Link>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/50">
              <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h1 className="mt-6 text-center font-display text-[24px] font-bold text-ink">Check your email</h1>
            <p className="mt-2 text-center text-[14px] leading-relaxed text-muted">
              We sent a password reset link to<br />
              <span className="font-medium text-ink">{resetEmail}</span>
            </p>
            <button type="button" onClick={() => { setView("login"); setResetEmail(""); setError(""); }} className="mt-8 w-full rounded-xl border border-line bg-surface py-3 text-[14px] font-semibold text-ink transition hover:border-primary hover:text-primary">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="inline-flex items-center gap-2.5 lg:hidden mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary">
              <span className="font-display text-base font-bold text-white">V</span>
            </div>
            <span className="font-display text-xl font-bold text-ink">Voxa</span>
          </Link>

          <h1 className="font-display text-[26px] font-bold text-ink">
            {view === "forgot" ? "Reset your password" : "Welcome back"}
          </h1>
          {view === "forgot" && (
            <p className="mt-1.5 text-[14px] text-muted">Enter your email and we&apos;ll send you a reset link.</p>
          )}

          {view === "forgot" ? (
            <form onSubmit={handleResetPassword} className="mt-8">
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                  {error}
                </div>
              )}

              <label className="block text-[13px] font-semibold text-ink">Email</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onFocus={() => setFocused("reset-email")}
                onBlur={() => setFocused(null)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${focused === "reset-email" ? "border-primary ring-2 ring-primary/15" : "border-line"} bg-soft`}
                placeholder="you@example.com"
              />

              <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-primary py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Sending\u2026" : "Send reset link"}
              </button>

              <button type="button" onClick={() => { setView("login"); setError(""); }} className="mt-5 w-full text-center text-[13px] font-semibold text-muted transition hover:text-primary">
                &larr; Back to sign in
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-8">
                {error && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                    {error}
                  </div>
                )}

                <label className="block text-[13px] font-semibold text-ink">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${focused === "email" ? "border-primary ring-2 ring-primary/15" : "border-line"} bg-soft`} placeholder="you@example.com" />

                <label className="mt-5 block text-[13px] font-semibold text-ink">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${focused === "password" ? "border-primary ring-2 ring-primary/15" : "border-line"} bg-soft`} placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />

                <div className="mt-2.5 text-right">
                  <button type="button" onClick={() => { setView("forgot"); setResetEmail(email); setError(""); }} className="text-[12px] font-semibold text-primary transition hover:text-primary-strong">Forgot password?</button>
                </div>

                <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-primary py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Signing in\u2026" : "Sign in"}
                </button>

                <p className="mt-5 text-center text-[13px] text-muted">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="font-semibold text-primary transition hover:text-primary-strong">Create one</Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
