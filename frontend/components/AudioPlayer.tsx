"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "./Spinner";
import { apiFetch } from "../lib/api";

type AudioPlayerProps = {
  src: string;
  autoPlay?: boolean;
  playKey?: number;
  subtitlesPath?: string;
};

type SrtWord = {
  word: string;
  start: number;
  end: number;
};

type SrtCue = {
  start: number;
  end: number;
  words: SrtWord[];
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

const WAVEFORM_BARS = 50;
const waveformHeights = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
  const x = i / WAVEFORM_BARS;
  return (
    Math.sin(x * Math.PI * 3) * 0.15 +
    Math.sin(x * Math.PI * 7) * 0.1 +
    Math.sin(x * Math.PI * 13) * 0.05 +
    0.5
  );
});

function parseSrtTime(value: string): number {
  const match = value.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{1,3})/);
  if (!match) return 0;
  const [, h, m, s, ms] = match.map(Number);
  return h * 3600 + m * 60 + s + ms / 1000;
}

function parseSrt(text: string): SrtCue[] {
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const cues: SrtCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim());
    const start = parseSrtTime(startRaw);
    const end = parseSrtTime(endRaw);
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);
    const tokens = textLines.join(" ").trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const duration = Math.max(end - start, 0.01);
    const words: SrtWord[] = tokens.map((word, i) => ({
      word,
      start: start + (duration * i) / tokens.length,
      end: start + (duration * (i + 1)) / tokens.length,
    }));
    cues.push({ start, end, words });
  }
  return cues;
}

function findActiveCue(cues: SrtCue[], time: number): SrtCue | null {
  for (const cue of cues) {
    if (time >= cue.start && time <= cue.end) return cue;
  }
  return null;
}

export function AudioPlayer({
  src,
  autoPlay = false,
  playKey = 0,
  subtitlesPath,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [srtCues, setSrtCues] = useState<SrtCue[]>([]);
  const [srtError, setSrtError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(false);

    if (autoPlay) {
      const playPromise = audio.play();
      playPromise?.catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
    };
  }, [src, playKey, autoPlay]);

  useEffect(() => {
    let cancelled = false;
    if (!subtitlesPath) return;
    apiFetch(subtitlesPath)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return await res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const cues = parseSrt(text);
        setSrtCues(cues);
        setSrtError(cues.length === 0);
      })
      .catch(() => {
        if (!cancelled) {
          setSrtCues([]);
          setSrtError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [subtitlesPath]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play()?.catch(() => setError(true));
    } else {
      audio.pause();
    }
  }

  function handleSeek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function handleWaveformClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    handleSeek(progress * duration);
  }

  const activeCue = findActiveCue(srtCues, currentTime);
  const hasWords = srtCues.length > 0;
  const subtitlesBlock = (
    <div className="mt-3 border-t border-line pt-3">
      {srtError && !hasWords ? (
        <p className="text-[11px] text-muted">Subtitles unavailable.</p>
      ) : (
        <div className="max-h-28 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] leading-relaxed">
            {activeCue?.words.map((w, i) => {
              const isActive = currentTime >= w.start && currentTime <= w.end;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSeek(w.start)}
                  className={`rounded transition ${
                    isActive
                      ? "bg-primary px-1.5 font-semibold text-white"
                      : "px-1 text-muted hover:bg-soft hover:text-primary"
                  }`}
                >
                  {w.word}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl bg-soft p-4">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) =>
          setDuration(event.currentTarget.duration || 0)
        }
        onDurationChange={(event) =>
          setDuration(event.currentTarget.duration || 0)
        }
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
      />

      {error ? (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">
          Could not load this audio file. It may have been deleted.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] transition hover:bg-primary-strong active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
            >
              {isLoading ? (
                <Spinner className="h-4 w-4" />
              ) : isPlaying ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="ml-0.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div
                ref={waveformRef}
                onClick={handleWaveformClick}
                className="flex h-8 cursor-pointer items-end gap-[2px] group"
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
              >
                {waveformHeights.map((h, i) => {
                  const progress = duration ? currentTime / duration : 0;
                  const barProgress = (i + 0.5) / WAVEFORM_BARS;
                  const isPlayed = barProgress <= progress;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-colors duration-75 ${
                        isPlayed ? "bg-primary" : "bg-primary-200 group-hover:bg-primary-200"
                      }`}
                      style={{ height: `${h * 100}%` }}
                    />
                  );
                })}
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-muted">
                <span>{formatTime(currentTime)}</span>
                <span>{duration ? formatTime(duration) : "\u2014:——"}</span>
              </div>
            </div>
          </div>

          {(subtitlesPath || hasWords) && subtitlesBlock}
        </>
      )}
    </div>
  );
}