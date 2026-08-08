export type Generation = {
  filename: string;
  voice: string;
  speed: number;
  text: string;
  created_at: string;
  size: number;
};

type GenerationHistoryProps = {
  items: Generation[];
  selectedFilename?: string;
  onSelect: (filename: string) => void;
};

export function GenerationHistory({ items, selectedFilename, onSelect }: GenerationHistoryProps) {
  return (
    <section className="rounded-[1.75rem] border border-[#DCE9FB] bg-[#F5F9FF] p-6 shadow-[0_20px_50px_-35px_rgba(37,99,235,0.25)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
            Recent Generations
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#15172B]">
            Generation history
          </h2>
        </div>
        <p className="text-sm text-[#676C89]">
          Browse recent audio with voice, speed and sample text.
        </p>
      </div>

      {items.length > 0 ? (
        <ul className="grid gap-3">
          {items.map((item) => {
            const displayName = `Audio ${item.filename.split("_")[1].split(".")[0].slice(0, 8)}`;
            const isActive = item.filename === selectedFilename;
            return (
              <li key={item.filename}>
                <button
                  type="button"
                  onClick={() => onSelect(item.filename)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[#2563EB] bg-[#DBEAFE] shadow-sm"
                      : "border-[#DCE9FB] bg-white hover:border-[#BFDBFE]"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#15172B]">{displayName}</p>
                      <p className="mt-1 text-sm text-[#15172B]">{item.voice} • {item.speed.toFixed(2)}×</p>
                      <p className="mt-2 text-sm text-[#676C89] line-clamp-2">{item.text}</p>
                    </div>
                    <div className="text-right text-xs text-[#94a3b8]">
                      <p>{new Date(item.created_at).toLocaleString()}</p>
                      <p>{(item.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#DCE9FB] bg-white p-6 text-sm text-[#676C89]">
          No recent audio has been generated yet.
        </div>
      )}
    </section>
  );
}
