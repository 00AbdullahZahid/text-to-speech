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
      className="w-full rounded-full bg-[#3B2FD4] px-6 py-3 text-sm font-semibold text-white transition enabled:hover:bg-[#2f2bc9] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isGenerating ? "Generating…" : "Generate speech"}
    </button>
  );
}
