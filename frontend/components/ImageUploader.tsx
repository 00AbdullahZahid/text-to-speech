"use client";

import { useState } from "react";
import ImageUploading, { ImageListType, ImageType } from "react-images-uploading";
import { Spinner } from "./Spinner";

type ImageUploaderProps = {
  onExtractText?: (imageDataUrl: string) => void | Promise<void>;
  isExtracting?: boolean;
  onImageListChange?: (hasImage: boolean) => void;
};

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploader({
  onExtractText,
  isExtracting = false,
  onImageListChange,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageListType>([]);

  const onChange = (imageList: ImageListType) => {
    setImages(imageList);
    onImageListChange?.(imageList.length > 0);
  };

  return (
    <section className="space-y-4">
      <ImageUploading
        multiple={false}
        value={images}
        onChange={onChange}
        maxNumber={1}
        dataURLKey="data_url"
      >
        {({
          imageList,
          onImageUpload,
          onImageRemove,
          isDragging,
          dragProps,
        }) => (
          <div className="space-y-4">
            <div
              {...dragProps}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
                isDragging
                  ? "border-[#2563EB] bg-[#DBEAFE]"
                  : "border-[#BFDBFE] bg-[#F5F9FF] hover:border-[#2563EB] hover:bg-[#EFF6FF]"
              }`}
            >
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
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#15172B]">
                {isDragging ? "Drop the image here" : "Upload an image"}
              </p>
              <p className="text-xs text-[#676C89]">
                Click or drag &amp; drop a single image to extract its text
              </p>
              <button
                type="button"
                onClick={onImageUpload}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:ring-offset-2"
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
                  <polyline points="7 10 12 5 17 10" />
                  <line x1="12" y1="5" x2="12" y2="19" />
                </svg>
                Browse files
              </button>
            </div>

            {imageList.map((image: ImageType, index: number) => {
              const file = image.file;
              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-[#DCE9FB] bg-white shadow-sm"
                >
                  <img
                    src={image.data_url}
                    alt={`Uploaded image ${index + 1}`}
                    className="h-36 w-full rounded-t-3xl object-cover"
                  />
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-[#15172B]">
                        <svg
                          className="h-4 w-4 shrink-0 text-[#2563EB]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        {file?.name || `image-${index + 1}`}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[#676C89]">
                        {formatSize(file?.size)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isExtracting}
                        onClick={() => {
                          const imageDataUrl = image.data_url as string;
                          onExtractText?.(imageDataUrl);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isExtracting ? (
                          <>
                            <Spinner className="h-3.5 w-3.5" />
                            Extracting…
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
                              <path d="M9 17v-6a3 3 0 016 0v6" />
                              <path d="M5 17h14" />
                            </svg>
                            Extract text
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onImageRemove(index)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-xs font-semibold text-[#991B1B] transition hover:bg-[#FEE2E2] focus:outline-none focus:ring-2 focus:ring-[#FECACA]"
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
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ImageUploading>
    </section>
  );
}
