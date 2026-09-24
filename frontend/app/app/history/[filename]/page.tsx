"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, API_URL } from "../../../../lib/api";
import { AudioPlayer } from "../../../../components/AudioPlayer";
import { SpectrumBars } from "../../../../components/SpectrumBars";
import { voiceName } from "../../../../lib/voices";
import { GradientIcon } from "../../../../components/Decorative";

type Generation = {
  filename: string;
  voice: string;
  speed: number;
  text: string;
  size: number;
  created_at: string;
  audio_url?: string;
  storage_path?: string;
  format?: string;
  has_subtitles?: boolean;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function GenerationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const filename = decodeURIComponent(params.filename as string);
  const [gen, setGen] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch(`/audio/${encodeURIComponent(filename)}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setGen(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filename]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/audio/${encodeURIComponent(filename)}`, { method: "DELETE" });
      router.push("/app/history");
    } finally { setDeleting(false); }
  }

  async function handleDownloadSubtitles() {
    try {
      const res = await apiFetch(`/generate/${encodeURIComponent(gen!.filename)}/subtitles`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = gen!.filename.replace(/\.[^.]+$/, "") + ".srt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Subtitles unavailable for this file.");
    }
  }

  if (loading) return <div className="mt-12 flex justify-center"><SpectrumBars size="lg" animate className="text-primary" /></div>;
  if (!gen) return (
    <div className="mt-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-strong text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)]"><SpectrumBars size="md" className="text-white" /></div>
      <p className="text-[14px] font-semibold text-ink">Generation not found</p>
      <Link href="/app/history" className="mt-3 inline-block text-[13px] font-semibold text-primary">Back to history</Link>
    </div>
  );

  const audioUrl = gen.audio_url?.startsWith("http") ? gen.audio_url : `${API_URL}/outputs/${gen.filename}`;

  return (
    <>
      <div className="mb-6 flex items-start gap-3">
        <Link href="/app/history" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted transition hover:text-primary">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to history
        </Link>
      </div>
      <div className="mb-6 flex items-start gap-4">
        <GradientIcon tone="primary" className="h-12 w-12 rounded-2xl">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </GradientIcon>
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight text-ink">Generation Details</h1>
          <p className="mt-1 text-[13px] text-muted">{formatDate(gen.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-[15px] font-semibold text-ink">Audio</h2>
            <AudioPlayer
              src={audioUrl}
              subtitlesPath={gen.has_subtitles ? `/generate/${encodeURIComponent(gen.filename)}/subtitles` : undefined}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={audioUrl} download={gen.filename} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-deep py-2.5 text-[13px] font-semibold text-white transition hover:bg-deep dark:bg-primary dark:hover:bg-primary-strong">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download {(gen.format || "wav").toUpperCase()}
              </a>
              {gen.has_subtitles && (
                <button type="button" onClick={handleDownloadSubtitles} className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-soft px-4 py-2.5 text-[13px] font-semibold text-primary transition hover:bg-primary-100">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="10" y1="13" x2="14" y2="13" /><line x1="10" y1="17" x2="14" y2="17" /><line x1="8" y1="13" x2="6" y2="13" /><line x1="8" y1="17" x2="6" y2="17" /></svg>
                  SRT
                </button>
              )}
              <button type="button" onClick={() => setShowDeleteModal(true)} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-surface px-4 py-2.5 text-[13px] font-semibold text-error transition hover:bg-red-50 dark:border-red-800/50 dark:hover:bg-red-950/40">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                Delete
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-surface p-6 shadow-sm">
            <h2 className="mb-3 text-[15px] font-semibold text-ink">Original text</h2>
            <p className="break-words text-[13px] leading-relaxed text-ink whitespace-pre-wrap [overflow-wrap:anywhere]">{gen.text || "No text recorded."}</p>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl bg-surface p-6 shadow-sm">
            <h3 className="mb-4 text-[13px] font-semibold text-ink">Metadata</h3>
            <dl className="space-y-3">
              {[
                ["Voice", voiceName(gen.voice)],
                ["Speed", `${gen.speed}\u00d7`],
                ["File type", (gen.format || "wav").toUpperCase()],
                ["Size", formatSize(gen.size)],
                ["Created", formatDate(gen.created_at)],
                ["Storage", gen.storage_path ? "Supabase + Local" : "Local only"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-[12px] text-muted">{label}</dt>
                  <dd className="text-[12px] font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteModal(false)}>
          <div className="mx-4 w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-ink">Delete this generation?</h3>
            <p className="mt-2 text-[13px] text-muted">This will remove the audio file and its metadata. This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-primary">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-xl bg-error px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-60">{deleting ? "Deleting\u2026" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
