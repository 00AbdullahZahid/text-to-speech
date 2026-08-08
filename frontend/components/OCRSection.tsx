"use client";

import { useState, type ChangeEvent } from "react";
import { ImageUploader } from "./ImageUploader";

type OCRSectionProps = {
  apiUrl: string;
  onUseExtractedText: (text: string) => void;
};

export function OCRSection({ apiUrl, onUseExtractedText }: OCRSectionProps) {
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasImage, setHasImage] = useState(false);

  async function handleExtractText(imageDataUrl: string) {
    setErrorMessage("");
    setOcrLoading(true);
    try {
      const response = await fetch(`${apiUrl}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: imageDataUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "OCR request failed");
      }

      const data = await response.json();
      setOcrText(data.text || "");
    } catch (error) {
      console.error("OCR extraction failed:", error);
      setErrorMessage("Unable to extract text from the image. Please try another image.");
    } finally {
      setOcrLoading(false);
    }
  }

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setOcrText(event.target.value);
  }

  return (
    <section className="rounded-[2rem] border border-[#DCE9FB] bg-[#F5F9FF] p-6 shadow-[0_20px_50px_-35px_rgba(37,99,235,0.2)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M16 3h-8v4" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
              OCR Scanner
            </p>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[#15172B]">Upload Image</h2>
        </div>
        <p className="text-sm text-[#676C89]">
          Upload a single image and extract editable text to review before using it.
        </p>
      </div>

      <div className="rounded-[2rem] border border-[#DCE9FB] bg-white p-5 shadow-sm">
        <ImageUploader
          onExtractText={handleExtractText}
          isExtracting={ocrLoading}
          onImageListChange={setHasImage}
        />
      </div>

      {!hasImage && !ocrLoading ? (
        <p className="mt-4 text-sm text-[#676C89]">
          Upload an image first, then tap Extract Text to review the result.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-[#15172B]" htmlFor="ocr-textarea">
          Review extracted text
        </label>
        <textarea
          id="ocr-textarea"
          value={ocrText}
          onChange={handleTextChange}
          rows={8}
          className="w-full rounded-3xl border border-[#DCE9FB] bg-white p-4 text-sm text-[#15172B] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#BFDBFE]"
          placeholder="OCR output will appear here once extraction completes."
        />
        <button
          type="button"
          disabled={!ocrText.trim() || ocrLoading}
          onClick={() => onUseExtractedText(ocrText)}
          className={`inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white transition ${
            !ocrText.trim() || ocrLoading
              ? "cursor-not-allowed bg-[#BFDBFE]"
              : "bg-[#2563EB] hover:bg-[#1D4ED8]"
          }`}
        >
          Use extracted text
        </button>
        <p className="text-sm text-[#676C89]">
          This will replace the script and scroll you back to the editor.
        </p>
      </div>
    </section>
  );
}
