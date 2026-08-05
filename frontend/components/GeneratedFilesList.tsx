type GeneratedFilesListProps = {
  files: string[];
  selectedFile?: string;
  onSelect: (filename: string) => void;
};

export function GeneratedFilesList({ files, selectedFile, onSelect }: GeneratedFilesListProps) {
  return (
    <section className="mt-6 rounded-[2rem] border border-[#E7E5F3] bg-[#F8F9FF] p-6 shadow-[0_20px_50px_-35px_rgba(59,47,212,0.25)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B2FD4]">
            Output files
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#15172B]">
            All generated audio
          </h2>
        </div>
        <p className="text-sm text-[#676C89]">
          Select any file to preview or download it.
        </p>
      </div>

      {files.length > 0 ? (
        <ul className="grid gap-3">
          {files.map((filename) => (
            <li key={filename}>
              <button
                type="button"
                onClick={() => onSelect(filename)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  filename === selectedFile
                    ? "border-[#3B2FD4] bg-[#EEF2FF] text-[#15172B] shadow-sm"
                    : "border-[#E7E5F3] bg-white text-[#15172B] hover:border-[#C7D2FE]"
                }`}
              >
                {filename}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E7E5F3] bg-white p-6 text-sm text-[#676C89]">
          No generated audio files were found yet. Generate speech to see them appear here.
        </div>
      )}
    </section>
  );
}
