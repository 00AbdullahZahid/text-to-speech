"use client";

import { useId } from "react";

// Reusable decorative primitives: soft gradient blobs, dot grids, a waveform
// illustration, and gradient icon tiles. Pure presentation — no interactions.

export function GradientBlobs({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-success/10 blur-3xl" />
    </div>
  );
}

export function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(37,99,235,0.12)_1px,transparent_1px)] [background-size:22px_22px] dark:bg-[radial-gradient(rgba(147,197,253,0.08)_1px,transparent_1px)] dark:[background-size:22px_22px] ${className}`}
    />
  );
}

export function WaveArt({ className = "", bars = 36 }: { className?: string; bars?: number }) {
  const id = useId();
  const heights: number[] = [];
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const wave = Math.sin(t * Math.PI * 4) * 0.35 + Math.sin(t * Math.PI * 9) * 0.2;
    heights.push(Math.round(Math.min(1, Math.max(0.12, 0.45 + wave)) * 100) / 20);
  }
  return (
    <svg
      viewBox={`0 0 ${bars * 12} 56`}
      preserveAspectRatio="none"
      aria-hidden
      className={`h-full w-full ${className}`}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="50%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <rect key={i} x={i * 12 + 2} y={28 - h * 12} width={8} rx={4} height={h * 24} fill={`url(#${id}-g)`} />
      ))}
    </svg>
  );
}

export function GradientIcon({
  children,
  tone = "primary",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "primary" | "violet" | "accent" | "success";
  className?: string;
}) {
  const tones: Record<string, string> = {
    primary: "from-primary via-primary to-deep",
    violet: "from-violet-500 via-primary to-[#7C3AED]",
    accent: "from-accent via-[#F59E0B] to-[#D97706]",
    success: "from-emerald-400 via-emerald-500 to-emerald-700",
  };
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.45)] ${tones[tone]} ${className}`}
    >
      <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-white/10 to-transparent" />
      <span className="relative">{children}</span>
    </div>
  );
}

export function GlowCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <GradientBlobs className="opacity-70" />
      <div className="relative">{children}</div>
    </div>
  );
}