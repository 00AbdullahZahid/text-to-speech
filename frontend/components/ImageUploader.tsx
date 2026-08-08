"use client";

import { useState } from "react";
import ImageUploading, { ImageListType, ImageType } from "react-images-uploading";

type ImageUploaderProps = {
  onExtractText?: (imageDataUrl: string) => void | Promise<void>;
  isExtracting?: boolean;
  onImageListChange?: (hasImage: boolean) => void;
};

export function ImageUploader({
  onExtractText,
  isExtracting = false,
  onImageListChange,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageListType>([]);
  const maxNumber = 69;

  const onChange = (imageList: ImageListType, addUpdateIndex?: number[]) => {
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
          onImageRemoveAll,
          onImageRemove,
          isDragging,
          dragProps,
        }) => (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[auto_auto] items-center">
              <button
                type="button"
                onClick={onImageUpload}
                {...dragProps}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] sm:w-auto"
                style={isDragging ? { color: "#FF8A3D" } : undefined}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 5 17 10" />
                  <line x1="12" y1="5" x2="12" y2="19" />
                </svg>
                Click Here
              </button>
              <button
                type="button"
                onClick={onImageRemoveAll}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#DCE9FB] bg-white px-5 py-3 text-sm font-semibold text-[#15172B] transition hover:border-[#2563EB] sm:w-auto"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14H7L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Remove image
              </button>
            </div>
            <div className="">
              {imageList.map((image: ImageType, index: number) => (
                <div key={index} className="rounded-3xl border border-[#DCE9FB] bg-white p-4 shadow-sm">
                  <img
                    src={image.data_url}
                    alt={`upload-${index}`}
                    className="h-28 w-full rounded-2xl object-cover"
                  />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={() => {
                        const imageDataUrl = image.data_url as string;
                        onExtractText?.(imageDataUrl);
                      }}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        isExtracting
                          ? "border-[#DCE9FB] bg-[#DBEAFE] text-[#1D4ED8] cursor-not-allowed"
                          : "border-[#DCE9FB] bg-[#EAF2FE] text-[#15172B] hover:border-[#2563EB]"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 17v-6a3 3 0 016 0v6" />
                        <path d="M5 17h14" />
                      </svg>
                      {isExtracting ? "Extracting text..." : "Extract text"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onImageRemove(index)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#DCE9FB] bg-white px-3 py-2 text-xs font-semibold text-[#15172B] transition hover:border-[#2563EB]"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-2 14H7L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ImageUploading>
    </section>
  );
}
