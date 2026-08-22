import { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { Spinner } from "./Spinner";

export type Generation = {
  filename: string;
  voice: string;
  speed: number;
  text: string;
  created_at: string;
  size: number;
  audio_url?: string;
};

type GenerationHistoryProps = {
  items: Generation[];
  selectedFilename?: string;
  apiUrl: string;
  onSelect: (filename: string) => void;
  onDelete: (filename: string) => Promise<void> | void;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function GenerationHistory({
  items,
  selectedFilename,
  apiUrl,
  onSelect,
  onDelete,
}: GenerationHistoryProps) {
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [openDetails, setOpenDetails] = useState<string | null>(null);

  async function handleConfirmDelete(filename: string) {
    setDeleting(filename);
    try {
      await onDelete(filename);
    } finally {
      setDeleting(null);
      setConfirmingDelete(null);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-[#DCE9FB] bg-[#F5F9FF] p-6 shadow-[0_20px_50px_-35px_rgba(37,99,235,0.25)]">
      <SectionHeader
        eyebrow="Recent Generations"
        title="Generation history"
        description="Browse, play, download or delete your recent takes."
        actions={
          <span className="rounded-full bg-[#DBEAFE] px-3 py-1 font-mono text-xs font-semibold text-[#2563EB]">
            {items.length}
          </span>
        }
      />

      {items.length > 0 ? (
        <ul className="grid gap-3">
          {items.map((item) => {
            const isActive = item.filename === selectedFilename;
            const isConfirming = confirmingDelete === item.filename;
            const downloadUrl =
              item.audio_url && item.audio_url.startsWith("http")
                ? item.audio_url
                : `${apiUrl}/outputs/${item.filename}`;

            return (
              <li
                key={item.filename}
                className={`overflow-hidden rounded-3xl border bg-white text-left transition ${
                  isActive
                    ? "border-[#2563EB] shadow-[0_10px_30px_-15px_rgba(37,99,235,0.4)]"
                    : "border-[#DCE9FB] hover:border-[#BFDBFE]"
                }`}
              >
                {isConfirming ? (
                  <div className="flex flex-col gap-3 bg-[#FEF2F2] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-[#991B1B]">
                      Delete this generation? This removes the audio file
                      permanently.
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmDelete.bind(null, item.filename)}
                        disabled={deleting === item.filename}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#B91C1C] focus:outline-none focus:ring-2 focus:ring-[#FECACA] disabled:opacity-60"
                      >
                        {deleting === item.filename ? (
                          <>
                            <Spinner className="h-3.5 w-3.5" />
                            Deleting…
                          </>
                        ) : (
                          "Yes, delete"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(null)}
                        className="rounded-full border border-[#DCE9FB] bg-white px-4 py-2 text-xs font-semibold text-[#15172B] transition hover:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelect(item.filename)}
                      aria-current={isActive}
                      className="block w-full px-4 py-4 text-left transition hover:bg-[#F8FBFF] focus:outline-none focus:bg-[#F8FBFF]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#15172B]">
                              {item.voice} · {item.speed.toFixed(2)}×
                            </p>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                <svg
                                  className="h-2.5 w-2.5"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                                Playing
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-[#676C89] line-clamp-2">
                            {item.text || "No text recorded for this take."}
                          </p>
                          <p className="mt-2 text-xs text-[#94A3B8]">
                            {formatDate(item.created_at) || "—"}
                            <span className="mx-1.5">·</span>
                            {formatSize(item.size)}
                          </p>
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-wrap items-center gap-2 border-t border-[#DCE9FB] bg-[#F8FBFF] px-4 py-2.5">
                      <a
                        href={downloadUrl}
                        download={item.filename}
                        title={item.filename}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#2563EB] transition hover:bg-[#DBEAFE] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDetails((current) =>
                            current === item.filename ? null : item.filename
                          )
                        }
                        aria-expanded={openDetails === item.filename}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] ${
                          openDetails === item.filename
                            ? "bg-[#DBEAFE] text-[#2563EB]"
                            : "text-[#676C89] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                        }`}
                      >
                        <svg
                          className={`h-3.5 w-3.5 transition ${
                            openDetails === item.filename ? "rotate-90" : ""
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(item.filename)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#991B1B] transition hover:bg-[#FEE2E2] focus:outline-none focus:ring-2 focus:ring-[#FECACA]"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-2 14H7L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                        Delete
                      </button>
                    </div>

                    {openDetails === item.filename ? (
                      <div className="border-t border-[#DCE9FB] bg-white px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                          File
                        </p>
                        <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-[#676C89]">
                          {item.filename}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#BFDBFE] bg-white px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DBEAFE] text-[#2563EB]">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0012 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#15172B]">
              No generations yet
            </p>
            <p className="mt-1 text-sm text-[#676C89]">
              Generate your first voiceover and it will appear here.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
