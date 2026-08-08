type SpeedControlProps = {
  speed: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export function SpeedControl({ speed, min, max, onChange }: SpeedControlProps) {
  return (
    <section className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm">
        <label htmlFor="speed" className="font-semibold text-[#15172B]">
          Speed
        </label>
        <span className="text-[#676C89]">{speed.toFixed(2)}×</span>
      </div>
      <input
        id="speed"
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={speed}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer accent-[#2563EB]"
      />
    </section>
  );
}
