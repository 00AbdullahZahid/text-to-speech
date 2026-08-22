type SpeedControlProps = {
  speed: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function SpeedControl({
  speed,
  min,
  max,
  onChange,
  disabled = false,
}: SpeedControlProps) {
  const isNormal = Math.abs(speed - 1) < 0.001;

  return (
    <section className="mb-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label htmlFor="speed" className="text-sm font-semibold text-[#15172B]">
          Speed
        </label>
        <div
          className={`inline-flex items-baseline gap-0.5 rounded-full border px-3.5 py-1.5 shadow-sm transition ${
            isNormal
              ? "border-[#DCE9FB] bg-white"
              : "border-[#2563EB] bg-[#DBEAFE]"
          } ${disabled ? "opacity-60" : ""}`}
        >
          <span className="font-mono text-xl font-semibold leading-none text-[#15172B]">
            {speed.toFixed(2)}
          </span>
          <span className="text-xs font-semibold text-[#2563EB]">×</span>
        </div>
      </div>

      <input
        id="speed"
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={speed}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        aria-valuetext={`${speed.toFixed(2)} times speed`}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#DBEAFE] accent-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[#676C89]">
        <span>{min.toFixed(1)}×</span>
        <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[#2563EB]">
          {isNormal ? "Normal" : speed > 1 ? "Faster" : "Slower"}
        </span>
        <span>{max.toFixed(1)}×</span>
      </div>
    </section>
  );
}
