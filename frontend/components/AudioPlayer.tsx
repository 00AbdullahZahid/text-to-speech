"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "./Spinner";

type AudioPlayerProps = {
  src: string;
  autoPlay?: boolean;
  playKey?: number;
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

export function AudioPlayer({
  src,
  autoPlay = false,
  playKey = 0,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

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

  return (
    <div className="rounded-2xl bg-[#EFF6FF] p-4">
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
        <p role="alert" className="text-sm font-medium text-[#991B1B]">
          Could not load this audio file. It may have been deleted.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] transition hover:bg-[#1D4ED8] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:ring-offset-2"
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
              className="flex items-end gap-[2px] h-8 cursor-pointer group"
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
                      isPlayed ? "bg-[#2563EB]" : "bg-[#BFDBFE] group-hover:bg-[#BFDBFE]"
                    }`}
                    style={{ height: `${h * 100}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-[#64748B]">
              <span>{formatTime(currentTime)}</span>
              <span>{duration ? formatTime(duration) : "\u2014:——"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
