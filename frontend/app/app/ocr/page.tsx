"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { SpectrumBars } from "../../../components/SpectrumBars";

type OcrState = "upload" | "uploading" | "processing" | "result" | "error";

export default function OcrPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<OcrState>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setState("uploading");
    };
    reader.readAsDataURL(file);
    setOcrText("");
    setError("");
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }

  async function handleExtract() {
    if (!image) return;
    setState("processing");
    setError("");
    try {
      const res = await apiFetch("/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: image }),
      });
      if (!res.ok) {
        let detail = "OCR request failed.";
        try {
          const b = await res.json();
          if (typeof b?.detail === "string") detail = b.detail;
        } catch {}
        throw new Error(detail);
      }
      const data = await res.json();
      setOcrText(data.text || "");
      setState("result");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to extract text from the image. Check that the image is clear and contains readable text, then try again."
      );
      setState("error");
    }
  }

  function handleContinueToTTS() {
    router.push(`/app?ocrText=${encodeURIComponent(ocrText)}`);
  }

  function handleReset() {
    setImage(null);
    setImageName("");
    setOcrText("");
    setError("");
    setState("upload");
  }

  function handleRetry() {
    setError("");
    setState("uploading");
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="font-display text-[24px] font-bold tracking-tight text-[#0B1739]">
          Image OCR
        </h1>
        <p className="mt-1 text-[14px] text-[#64748B]">
          Review extracted text before sending it to the TTS studio.
        </p>
      </div>

      {/* ── Upload State ───────────────────────────────────── */}
      {state === "upload" && (
        <div className="fade-in">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition ${
              dragOver
                ? "border-[#2563EB] bg-[#EFF6FF]"
                : "border-[#BFDBFE] bg-white hover:border-[#93C5FD] hover:bg-[#EFF6FF]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
              <SpectrumBars size="lg" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-[#0B1739]">
                Drop an image here or{" "}
                <span className="text-[#2563EB]">browse</span>
              </p>
              <p className="mt-1.5 text-[13px] text-[#64748B]">
                PNG, JPG, WEBP &middot; text is extracted automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Uploading State (file selected, about to send) ── */}
      {state === "uploading" && (
        <div className="fade-in">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              {/* Left: Image Preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[#F0F7FF] p-4" style={{ minHeight: 240 }}>
                  {image && (
                    <img
                      src={image}
                      alt="Uploaded"
                      className="max-h-[280px] w-full rounded-lg object-contain"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Image preview
                  </span>
                </div>
              </div>

              {/* Right: Preparing */}
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                  <SpectrumBars size="lg" className="text-[#2563EB]" />
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-semibold text-[#0B1739]">
                    Image loaded
                  </p>
                  <p className="mt-1 text-[12px] text-[#64748B]">
                    {imageName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExtract}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-[13px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)] transition hover:bg-[#1D4ED8] active:scale-[0.98]"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  Extract text
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[12px] font-medium text-[#64748B] transition hover:text-[#0B1739]"
                >
                  Choose a different image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Processing State ───────────────────────────────── */}
      {state === "processing" && (
        <div className="fade-in">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              {/* Left: Image Preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[#F0F7FF] p-4" style={{ minHeight: 240 }}>
                  {image && (
                    <img
                      src={image}
                      alt="Uploaded"
                      className="max-h-[280px] w-full rounded-lg object-contain"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Image preview
                  </span>
                </div>
              </div>

              {/* Right: Processing */}
              <div className="flex flex-col items-center justify-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                  <SpectrumBars size="xl" animate className="text-[#2563EB]" />
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-semibold text-[#0B1739]">
                    Analyzing image&hellip;
                  </p>
                  <p className="mt-1.5 text-[12px] text-[#64748B]">
                    Qwen2.5-VL-3B-Instruct is reading your image
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[#94A3B8]">
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      opacity="0.25"
                    />
                    <path
                      d="M12 2a10 10 0 019.95 9"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  This may take a few seconds
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Error State ────────────────────────────────────── */}
      {state === "error" && (
        <div className="fade-in">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              {/* Left: Image Preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-[#F0F7FF] p-4" style={{ minHeight: 240 }}>
                  {image && (
                    <img
                      src={image}
                      alt="Uploaded"
                      className="max-h-[280px] w-full rounded-lg object-contain"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF6B6B]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Image preview
                  </span>
                </div>
              </div>

              {/* Right: Error */}
              <div className="flex flex-col items-center justify-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <svg
                    className="h-8 w-8 text-[#FF6B6B]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-semibold text-[#0B1739]">
                    Extraction failed
                  </p>
                  <p className="mt-1.5 max-w-[320px] text-[13px] leading-relaxed text-[#64748B]">
                    {error}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] active:scale-[0.98]"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 4v6h6" />
                      <path d="M23 20v-6h-6" />
                      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                    </svg>
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#0B1739] transition hover:border-[#2563EB] hover:text-[#2563EB]"
                  >
                    New image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Result State ───────────────────────────────────── */}
      {state === "result" && (
        <div className="fade-in">
          {/* Success banner */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-3.5 ring-1 ring-emerald-200">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-4 w-4 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-emerald-800">
                Extraction complete
              </p>
              <p className="text-[12px] text-emerald-600">
                Text successfully extracted
              </p>
            </div>
          </div>

          {/* Main card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              {/* Left: Image Preview */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[13px] font-semibold text-[#0B1739]">
                  Image Preview
                </h3>
                <div className="flex items-center justify-center overflow-hidden rounded-xl bg-[#F0F7FF] p-4" style={{ minHeight: 280 }}>
                  {image && (
                    <img
                      src={image}
                      alt="Uploaded"
                      className="max-h-[340px] w-full rounded-lg object-contain"
                    />
                  )}
                </div>
                <p className="text-center text-[11px] text-[#94A3B8]">
                  {imageName}
                </p>
              </div>

              {/* Right: Extracted Text */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-[#0B1739]">
                    Extracted text
                  </h3>
                  <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#2563EB]">
                    {ocrText.length} characters
                  </span>
                </div>
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  rows={14}
                  className="mt-3 w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#EFF6FF] p-4 text-[13px] leading-relaxed text-[#0B1739] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                />

                <div className="mt-4 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleContinueToTTS}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)] transition hover:bg-[#1D4ED8] active:scale-[0.99]"
                  >
                    Send extracted text to TTS
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(ocrText)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-[12px] font-semibold text-[#0B1739] transition hover:border-[#2563EB] hover:text-[#2563EB]"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy text
                    </button>
                    <button
                      type="button"
                      onClick={handleExtract}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-[12px] font-semibold text-[#0B1739] transition hover:border-[#2563EB] hover:text-[#2563EB]"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 4v6h6" />
                        <path d="M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                      </svg>
                      Run again
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white py-2.5 text-[12px] font-semibold text-[#0B1739] transition hover:border-[#2563EB] hover:text-[#2563EB]"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      New image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
