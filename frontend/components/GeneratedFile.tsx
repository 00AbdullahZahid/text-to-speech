import type { Generation } from "./GenerationHistory";
import { AudioPlayer } from "./AudioPlayer";

type GeneratedFileProps = {
  generation?: Generation | null;
  audioUrl?: string;
};

export function GeneratedFile({ generation, audioUrl }: GeneratedFileProps) {
  const filename = generation?.filename ?? "generated-speech.mp3";
  const downloadUrl = audioUrl || (generation ? `/outputs/${generation.filename}` : "");

  return (
    <section className="mt-6 rounded-[2rem] border border-[#E7E5F3] bg-[#F8F9FF] p-6 shadow-[0_20px_50px_-35px_rgba(59,47,212,0.25)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B2FD4]">
            Playback
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#15172B]">
            Generated speech
          </h2>
        </div>
        <p className="text-sm text-[#676C89]">
          {audioUrl ? "Play or download the generated file below." : "Audio output will appear here after generation."}
        </p>
      </div>

      {generation ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-[#E7E5F3] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#15172B]">{generation.voice} • {generation.speed.toFixed(2)}×</p>
              <p className="mt-1 text-xs text-[#676C89] line-clamp-2">{generation.text}</p>
            </div>
            <div className="space-y-1 text-right text-xs text-[#94a3b8]">
              <p>{new Date(generation.created_at).toLocaleString()}</p>
              <p>{(generation.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <AudioPlayer src={downloadUrl} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E7E5F3] bg-white p-6 text-sm text-[#676C89]">
          Your generated speech will show up here once the audio is ready.
        </div>
      )}
    </section>
  );
}
