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
          className="text-xs font-medium text-[#3B2FD4] hover:text-[#2563eb]"
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
        className="w-full resize-none rounded-2xl border border-[#E7E5F3] bg-[#F8F9FF] p-4 text-sm leading-relaxed text-[#15172B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
      />
      <div className="mt-1 flex justify-between text-xs">
        <span className={overLimit ? "font-medium text-[#3B2FD4]" : "text-[#676C89]"}>
          {charCount} / {charLimit} characters
        </span>
        {text && (
          <button
            type="button"
            onClick={onClear}
            className="text-[#3B2FD4] hover:text-[#2563eb]"
          >
            Clear
          </button>
        )}
      </div>
    </section>
  );
}
