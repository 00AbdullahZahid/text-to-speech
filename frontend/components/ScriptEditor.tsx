type ScriptEditorProps = {
  text: string;
  charCount: number;
  charLimit: number;
  overLimit: boolean;
  tooShort: boolean;
  validationError?: string | null;
  onTextChange: (value: string) => void;
  onUseExample: () => void;
  onClear: () => void;
};

export function ScriptEditor({
  text,
  charCount,
  charLimit,
  overLimit,
  tooShort,
  validationError,
  onTextChange,
  onUseExample,
  onClear,
}: ScriptEditorProps) {
  const nearLimit = !overLimit && charCount >= charLimit * 0.9;

  const countState =
    overLimit
      ? { className: "text-[#DC2626]", label: "Over the limit", icon: null }
      : nearLimit
        ? { className: "text-[#D97706]", label: "Nearing the limit", icon: null }
        : charCount > 0
          ? {
              className: "text-[#047857]",
              label: "Ready to generate",
              icon: (
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ),
            }
          : { className: "text-[#676C89]", label: "Enter some text", icon: null };

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor="script" className="text-sm font-semibold text-[#15172B]">
          Script
        </label>
        <button
          type="button"
          onClick={onUseExample}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[#2563EB] transition hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]"
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
            <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0012 2z" />
          </svg>
          Use an example
        </button>
      </div>

      <textarea
        id="script"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Start typing the words you want to hear…"
        rows={8}
        aria-invalid={overLimit || tooShort}
        className={`w-full resize-none rounded-2xl border bg-[#F5F9FF] p-4 text-sm leading-relaxed text-[#15172B] placeholder:text-[#94A3B8] transition focus:outline-none focus:ring-2 ${
          overLimit
            ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-[#FECACA]"
            : "border-[#DCE9FB] focus:border-[#2563EB] focus:ring-[#BFDBFE]"
        }`}
      />

      <div className="mt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${countState.className}`}
            aria-live="polite"
          >
            {countState.icon}
            {charCount} / {charLimit} characters
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              overLimit
                ? "bg-[#FEF2F2] text-[#DC2626]"
                : nearLimit
                  ? "bg-[#FFFBEB] text-[#D97706]"
                  : charCount > 0
                    ? "bg-[#ECFDF5] text-[#047857]"
                    : "bg-[#F1F5F9] text-[#676C89]"
            }`}
          >
            {countState.label}
          </span>
        </div>

        {validationError ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#991B1B]"
          >
            <svg
              className="mt-px h-3.5 w-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            {validationError}
          </p>
        ) : null}
      </div>

      {text ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#DCE9FB] bg-white px-4 py-2.5 text-xs font-semibold text-[#15172B] transition hover:border-[#2563EB] hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]"
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
          Clear script
        </button>
      ) : null}
    </section>
  );
}
