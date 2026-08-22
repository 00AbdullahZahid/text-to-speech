import { Spinner } from "./Spinner";

type GenerateButtonProps = {
  isGenerating: boolean;
  disabled: boolean;
  label?: string;
  hint?: string | null;
  onClick: () => void;
};

export function GenerateButton({
  isGenerating,
  disabled,
  label = "Generate speech",
  hint,
  onClick,
}: GenerateButtonProps) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isGenerating}
        title={hint || undefined}
        aria-busy={isGenerating}
        className={`group inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:ring-offset-2 ${
          isGenerating
            ? "cursor-wait bg-[#2563EB] text-white opacity-80"
            : disabled
              ? "cursor-not-allowed bg-[#DBEAFE] text-[#2563EB] opacity-70"
              : "bg-[#2563EB] text-white shadow-[0_10px_25px_-10px_rgba(37,99,235,0.6)] hover:bg-[#1D4ED8] active:scale-[0.99]"
        }`}
      >
        {isGenerating ? (
          <>
            <Spinner className="h-4 w-4" />
            Generating speech…
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4 transition enabled:group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            {label}
          </>
        )}
      </button>
      {hint && !isGenerating ? (
        <p role="status" className="text-center text-xs font-medium text-[#B45309]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
