"use client";

import { useState, type ChangeEvent } from "react";
import { ImageUploader } from "./ImageUploader";
import { Alert } from "./Alert";
import { SectionHeader } from "./SectionHeader";
import { apiFetch } from "../lib/api";

type OCRSectionProps = {
  apiUrl?: string;
  onUseExtractedText: (text: string) => void;
};

export function OCRSection({ onUseExtractedText }: OCRSectionProps) {
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasImage, setHasImage] = useState(false);

  async function handleExtractText(imageDataUrl: string) {
    setErrorMessage("");
    setExtractionSuccess(false);
    setOcrLoading(true);
    try {
      const response = await apiFetch("/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: imageDataUrl }),
      });

      if (!response.ok) {
        let detail = "OCR request failed.";
        try {
          const body = await response.json();
          if (typeof body?.detail === "string") detail = body.detail;
        } catch {
          // ignore malformed error body
        }
        throw new Error(detail);
      }

      const data = await response.json();
      setOcrText(data.text || "");
      setExtractionSuccess(Boolean(data.text?.trim()));
    } catch (error) {
      console.error("OCR extraction failed:", error);
      setErrorMessage(
        "Unable to extract text from the image. Check that the image is clear and contains readable text, then try again."
      );
    } finally {
      setOcrLoading(false);
    }
  }

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setOcrText(event.target.value);
  }

  return (
    <section className="rounded-[2rem] border border-[#DCE9FB] bg-[#F5F9FF] p-6 shadow-[0_20px_50px_-35px_rgba(37,99,235,0.2)]">
      <SectionHeader
        eyebrow="OCR Scanner"
        title="Upload image"
        description="Upload a single image and extract editable text to review before using it."
      />

      <div className="rounded-[2rem] border border-[#DCE9FB] bg-white p-5 shadow-sm">
        <ImageUploader
          onExtractText={handleExtractText}
          isExtracting={ocrLoading}
          onImageListChange={setHasImage}
        />
      </div>

      {!hasImage && !ocrLoading && !errorMessage ? (
        <p className="mt-4 text-sm text-[#676C89]">
          Upload an image first, then tap{" "}
          <span className="font-semibold text-[#15172B]">Extract text</span> to
          review the result.
        </p>
      ) : null}

      {errorMessage ? (
        <div className="mt-4">
          <Alert tone="error" title="Text extraction failed">
            {errorMessage}
          </Alert>
        </div>
      ) : null}

      {extractionSuccess && !errorMessage ? (
        <div className="mt-4">
          <Alert tone="success" title="Text extracted">
            Review the extracted text below, then use it as your script.
          </Alert>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label
            className="block text-sm font-semibold text-[#15172B]"
            htmlFor="ocr-textarea"
          >
            Review extracted text
          </label>
          <span className="font-mono text-xs text-[#676C89]">
            {ocrText.length} characters
          </span>
        </div>
        <textarea
          id="ocr-textarea"
          value={ocrText}
          onChange={handleTextChange}
          rows={8}
          className="w-full rounded-2xl border border-[#DCE9FB] bg-white p-4 text-sm leading-relaxed text-[#15172B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#BFDBFE]"
          placeholder="OCR output will appear here once extraction completes."
        />
        <button
          type="button"
          disabled={!ocrText.trim() || ocrLoading}
          onClick={() => onUseExtractedText(ocrText)}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:ring-offset-2 ${
            !ocrText.trim() || ocrLoading
              ? "cursor-not-allowed bg-[#BFDBFE] text-white opacity-70"
              : "bg-[#2563EB] shadow-[0_10px_25px_-10px_rgba(37,99,235,0.6)] hover:bg-[#1D4ED8] active:scale-[0.99]"
          }`}
        >
          Use extracted text
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
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <p className="text-center text-xs text-[#676C89]">
          This replaces the script and scrolls you back to the editor.
        </p>
      </div>
    </section>
  );
}
