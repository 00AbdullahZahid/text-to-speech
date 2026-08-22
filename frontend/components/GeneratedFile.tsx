import type { Generation } from "./GenerationHistory";
import { AudioPlayer } from "./AudioPlayer";
import { SectionHeader } from "./SectionHeader";

type GeneratedFileProps = {
  generation?: Generation | null;
  audioUrl?: string;
  playSignal?: number;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function GeneratedFile({
  generation,
  audioUrl,
  playSignal = 0,
}: GeneratedFileProps) {
  return (
    <section className="rounded-[1.75rem] border border-[#DCE9FB] bg-[#F5F9FF] p-6 shadow-[0_20px_50px_-35px_rgba(37,99,235,0.25)]">
      <SectionHeader
        eyebrow="Playback"
        title="Generated speech"
        description={
          audioUrl
            ? "Your latest voiceover is ready to play or download."
            : "Audio output will appear here after generation."
        }
      />

      {generation && audioUrl ? (
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
                {generation.voice}
              </span>
              <span className="rounded-full bg-[#DBEAFE] px-3 py-1 font-mono text-xs font-semibold text-[#1D4ED8]">
                {generation.speed.toFixed(2)}×
              </span>
              <span className="ml-auto rounded-full bg-[#F5F9FF] px-2.5 py-1 font-mono text-xs text-[#676C89]">
                {formatSize(generation.size)}
              </span>
            </div>
            {generation.text ? (
              <p className="mt-3 text-sm leading-relaxed text-[#15172B] line-clamp-3">
                {generation.text}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[#94A3B8]">
              {formatDate(generation.created_at) || "—"}
            </p>
          </div>

          <AudioPlayer
            src={audioUrl}
            autoPlay={playSignal > 0}
            playKey={playSignal}
          />

          <a
            href={audioUrl}
            download={generation.filename}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(37,99,235,0.6)] transition hover:bg-[#1D4ED8] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
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
            Download audio
          </a>

          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-[#94A3B8] transition hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]">
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
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              File details
            </summary>
            <p className="mt-2 break-all rounded-xl bg-[#F5F9FF] px-3 py-2 font-mono text-[11px] text-[#676C89]">
              {generation.filename}
            </p>
          </details>
        </div>
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
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#15172B]">
              No speech generated yet
            </p>
            <p className="mt-1 text-sm text-[#676C89]">
              Your generated voiceover will show up here once it is ready.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
