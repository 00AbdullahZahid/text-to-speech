"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, API_URL } from "../../../lib/api";
import { SpectrumBars } from "../../../components/SpectrumBars";

type Generation = {
  filename: string;
  voice: string;
  speed: number;
  text: string;
  size: number;
  created_at: string;
  audio_url?: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

export default function HistoryPage() {
  const [history, setHistory] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [voiceFilter, setVoiceFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/audio").then((r) => r.json()).then((d) => setHistory(d.files || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const voices = useMemo(() => {
    const set = new Set(history.map((h) => h.voice));
    return Array.from(set);
  }, [history]);

  const filtered = useMemo(() => {
    let items = [...history];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.text?.toLowerCase().includes(q) || i.voice.toLowerCase().includes(q));
    }
    if (voiceFilter !== "all") items = items.filter((i) => i.voice === voiceFilter);
    items.sort((a, b) => sortOrder === "newest"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return items;
  }, [history, search, voiceFilter, sortOrder]);

  async function handleDelete(filename: string) {
    setDeleting(filename);
    try { await apiFetch(`/audio/${encodeURIComponent(filename)}`, { method: "DELETE" }); setHistory((h) => h.filter((i) => i.filename !== filename)); }
    finally { setDeleting(null); setConfirmingDelete(null); }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-[24px] font-bold tracking-tight text-[#110D2A]">Generation History</h1>
        <p className="mt-1 text-[14px] text-[#64748B]">View and manage all your generated audio.</p>
      </div>

      {!loading && history.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search generations..."
            className="flex-1 min-w-[200px] rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] text-[#110D2A] outline-none transition focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/15 placeholder:text-[#94A3B8]"
          />
          <select
            value={voiceFilter}
            onChange={(e) => setVoiceFilter(e.target.value)}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] text-[#110D2A] outline-none transition focus:border-[#7C5CFC]"
          >
            <option value="all">All voices</option>
            {voices.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setSortOrder((o) => o === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#110D2A] transition hover:border-[#7C5CFC]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            {sortOrder === "newest" ? "Newest" : "Oldest"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-12 flex justify-center"><SpectrumBars size="lg" animate className="text-[#7C5CFC]" /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3FF] text-[#C4B5FD]">
            <SpectrumBars size="lg" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#110D2A]">{history.length === 0 ? "No generations yet" : "No results found"}</p>
            <p className="mt-1 text-[13px] text-[#64748B]">{history.length === 0 ? "Generate your first voiceover and it will appear here." : "Try a different search or filter."}</p>
          </div>
          {history.length === 0 && <Link href="/app" className="mt-2 rounded-xl bg-[#7C5CFC] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(124,92,252,0.5)] transition hover:bg-[#6A4DE6]">Create your first voice</Link>}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const dl = item.audio_url?.startsWith("http") ? item.audio_url : `${API_URL}/outputs/${item.filename}`;
            if (confirmingDelete === item.filename) {
              return (
                <div key={item.filename} className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
                  <p className="text-[13px] font-medium text-red-700">Delete this generation? This action cannot be undone.</p>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => handleDelete(item.filename)} disabled={deleting === item.filename} className="rounded-xl bg-[#FF6B6B] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-red-600 disabled:opacity-60">{deleting === item.filename ? "Deleting\u2026" : "Yes, delete"}</button>
                    <button type="button" onClick={() => setConfirmingDelete(null)} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-[12px] font-semibold text-[#110D2A]">Cancel</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={item.filename} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C5CFC]">
                  <SpectrumBars size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#110D2A]">{item.text ? (item.text.length > 50 ? item.text.slice(0, 50) + "\u2026" : item.text) : "Untitled"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
                    <span>{item.voice}</span><span>&middot;</span><span>{item.speed}&times;</span><span>&middot;</span><span>{formatDate(item.created_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <a href={dl} download={item.filename} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7C5CFC] transition hover:bg-[#EDE9FE]" title="Download"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></a>
                  <Link href={`/app/history/${encodeURIComponent(item.filename)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F3FF] text-[#64748B] transition hover:bg-[#EDE9FE] hover:text-[#110D2A]" title="Details"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></Link>
                  <button type="button" onClick={() => setConfirmingDelete(item.filename)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F3FF] text-[#64748B] transition hover:bg-red-50 hover:text-[#FF6B6B]" title="Delete"><svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
