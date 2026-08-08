type GenerateButtonProps = {
  isGenerating: boolean;
  disabled: boolean;
  onClick: () => void;
};

export function GenerateButton({ isGenerating, disabled, onClick }: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition enabled:hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isGenerating ? "Generating…" : "Generate speech"}
    </button>
  );
}
