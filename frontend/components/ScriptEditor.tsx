type ScriptEditorProps = {
  text: string;
  charCount: number;
  charLimit: number;
  overLimit: boolean;
  onTextChange: (value: string) => void;
  onUseExample: () => void;
  onClear: () => void;
};

export function ScriptEditor({
  text,
  charCount,
  charLimit,
  overLimit,
  onTextChange,
  onUseExample,
  onClear,
}: ScriptEditorProps) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="script" className="text-sm font-semibold text-[#15172B]">
          Script
        </label>
        <button
          type="button"
          onClick={onUseExample}
          className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8]"
        >
          Use an example
        </button>
      </div>
      <textarea
        id="script"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="Start typing the words you want to hear…"
        rows={8}
        className="w-full resize-none rounded-2xl border border-[#DCE9FB] bg-[#F5F9FF] p-4 text-sm leading-relaxed text-[#15172B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]"
      />
      <div className="mt-1 flex justify-between text-xs">
        <span className={overLimit ? "font-medium text-[#2563EB]" : "text-[#676C89]"}>
          {charCount} / {charLimit} characters
        </span>
        {text && (
          <button
            type="button"
            onClick={onClear}
            className="text-[#2563EB] hover:text-[#1D4ED8]"
          >
            Clear
          </button>
        )}
      </div>
    </section>
  );
}
