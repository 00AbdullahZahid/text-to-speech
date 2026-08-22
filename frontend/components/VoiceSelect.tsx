"use client";

import { useRef, useState } from "react";
import { Spinner } from "./Spinner";

type Voice = {
  id: string;
  name: string;
};

type VoiceSelectProps = {
  voices: Voice[];
  selectedVoiceId: string;
  onChange: (voiceId: string) => void;
  loading?: boolean;
  disabled?: boolean;
  apiUrl?: string;
};

export function VoiceSelect({
  voices,
  selectedVoiceId,
  onChange,
  loading = false,
  disabled = false,
  apiUrl,
}: VoiceSelectProps) {
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState("");
  const currentUrlRef = useRef<string | null>(null);

  const locked = loading || disabled;

  function handleVoiceChange(voiceId: string) {
    onChange(voiceId);
    setPreviewError("");
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
      setPreviewUrl(null);
    }
  }

  async function handlePreview() {
    if (!apiUrl || !selectedVoiceId || previewing) return;
    setPreviewing(true);
    setPreviewError("");
    try {
      const response = await fetch(
        `${apiUrl}/preview?voiceId=${encodeURIComponent(selectedVoiceId)}&speed=1.0`
      );
      if (!response.ok) {
        throw new Error("Preview failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }
      currentUrlRef.current = url;
      setPreviewUrl(url);
    } catch (error) {
      console.error("Voice preview failed:", error);
      setPreviewError("Could not load the voice preview. Check the backend.");
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <section className="mb-5">
      <label htmlFor="voice" className="mb-2 block text-sm font-semibold text-[#15172B]">
        Voice
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#2563EB]">
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
            <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </span>
        <select
          id="voice"
          value={selectedVoiceId}
          onChange={(event) => handleVoiceChange(event.target.value)}
          disabled={locked}
          className="w-full appearance-none rounded-2xl border border-[#DCE9FB] bg-white py-3.5 pl-11 pr-11 text-sm text-[#15172B] shadow-sm transition duration-200 ease-out hover:border-[#BFDBFE] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] disabled:cursor-not-allowed disabled:bg-[#F5F9FF] disabled:text-[#94A3B8]"
        >
          {loading ? (
            <option value="">Loading voices…</option>
          ) : voices.length === 0 ? (
            <option value="">No voices available</option>
          ) : (
            voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))
          )}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#94A3B8]">
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
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      {apiUrl ? (
        <>
          <button
            type="button"
            onClick={handlePreview}
            disabled={locked || !selectedVoiceId || previewing}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#DCE9FB] bg-white px-4 py-2.5 text-xs font-semibold text-[#15172B] transition hover:border-[#2563EB] hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewing ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                Loading preview…
              </>
            ) : (
              <>
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
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Preview voice
              </>
            )}
          </button>
          {previewUrl ? (
            <div className="mt-2.5 rounded-2xl border border-[#DCE9FB] bg-[#F5F9FF] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#15172B]">
                  <svg
                    className="h-3.5 w-3.5 text-[#FF8A3D]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Preview:{" "}
                  {voices.find((voice) => voice.id === selectedVoiceId)?.name ||
                    selectedVoiceId}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUrlRef.current) {
                      URL.revokeObjectURL(currentUrlRef.current);
                      currentUrlRef.current = null;
                    }
                    setPreviewUrl(null);
                  }}
                  aria-label="Stop voice preview"
                  className="rounded-md p-1 text-[#676C89] transition hover:bg-black/5 hover:text-[#15172B] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]"
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
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <audio
                key={previewUrl}
                controls
                autoPlay
                className="w-full"
                src={previewUrl}
              />
            </div>
          ) : null}
          {previewError ? (
            <p role="alert" className="mt-2 text-xs font-medium text-[#991B1B]">
              {previewError}
            </p>
          ) : null}
        </>
      ) : null}

      <p className="mt-2 text-xs text-[#676C89]">
        {selectedVoiceId
          ? "Choose the voice used for your voiceover — preview it first to find the right tone."
          : "Select a voice to enable generation."}
      </p>
    </section>
  );
}
