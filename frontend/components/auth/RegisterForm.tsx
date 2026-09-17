"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/auth";
import { SpectrumBars } from "../SpectrumBars";

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-deep lg:flex lg:w-[45%] lg:items-center lg:justify-center">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div className="relative z-10 flex flex-col items-center px-12 text-center">
        <SpectrumBars size="xl" animate className="text-primary mb-10" />
        <h2 className="font-display text-[32px] font-bold leading-tight text-white">Your voice,<br />amplified.</h2>
        <p className="mt-4 max-w-[280px] text-[15px] leading-relaxed text-white/50">Join Voxa and start creating natural-sounding voiceovers with AI.</p>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirmPassword) { setError("Please fill in all fields."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/app");
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

          <h1 className="font-display text-[26px] font-bold text-ink">Create your Voxa account</h1>

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
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${focused === "password" ? "border-primary ring-2 ring-primary/15" : "border-line"} bg-soft`} placeholder="At least 6 characters" />

            <label className="mt-5 block text-[13px] font-semibold text-ink">Confirm password</label>
            <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)} className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition ${focused === "confirm" ? "border-primary ring-2 ring-primary/15" : "border-line"} bg-soft`} placeholder="Repeat password" />

            <button type="submit" disabled={loading} className="mt-7 w-full rounded-xl bg-primary py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Creating account\u2026" : "Create account"}
            </button>

            <p className="mt-5 text-center text-[13px] text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary transition hover:text-primary-strong">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
