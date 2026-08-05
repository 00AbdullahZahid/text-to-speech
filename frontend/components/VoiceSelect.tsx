type Voice = {
  id: string;
  name: string;
};

type VoiceSelectProps = {
  voices: Voice[];
  selectedVoiceId: string;
  onChange: (voiceId: string) => void;
};

export function VoiceSelect({ voices, selectedVoiceId, onChange }: VoiceSelectProps) {
  return (
    <section className="mb-5">
      <label htmlFor="voice" className="mb-2 block text-sm font-semibold text-[#15172B]">
        Voice
      </label>
      <div className="relative">
        <select
          id="voice"
          value={selectedVoiceId}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-3xl border border-[#E7E5F3] bg-white px-4 py-4 pr-11 text-sm text-[#15172B] shadow-sm transition duration-200 ease-out hover:border-[#C7D2FE] focus:border-[#3B2FD4] focus:outline-none focus:ring-2 focus:ring-[#C7D2FE]"
        >
          {voices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#94a3b8]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
    </section>
  );
}
