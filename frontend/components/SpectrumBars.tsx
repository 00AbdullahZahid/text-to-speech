type SpectrumBarsProps = {
  barCount?: number;
  heights?: number[];
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
};

const SIZES = {
  sm: { barWidth: 2, gap: 2 },
  md: { barWidth: 3, gap: 3 },
  lg: { barWidth: 4, gap: 3 },
  xl: { barWidth: 6, gap: 4 },
};

const DEFAULT_HEIGHTS: Record<string, number[]> = {
  sm: [6, 12, 8, 14, 6],
  md: [10, 20, 14, 22, 10],
  lg: [16, 32, 22, 36, 16],
  xl: [30, 60, 42, 72, 30],
};

export function SpectrumBars({
  barCount = 5,
  heights,
  size = "md",
  animate = false,
  className = "",
}: SpectrumBarsProps) {
  const config = SIZES[size];
  const bars = heights || DEFAULT_HEIGHTS[size].slice(0, barCount);
  const totalWidth = bars.length * config.barWidth + (bars.length - 1) * config.gap;
  const maxH = Math.max(...bars);

  return (
    <svg
      className={`${animate ? "spectrum-animate" : ""} ${className}`}
      width={totalWidth}
      height={maxH}
      viewBox={`0 0 ${totalWidth} ${maxH}`}
    >
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * (config.barWidth + config.gap)}
          y={maxH - h}
          width={config.barWidth}
          height={h}
          rx={config.barWidth / 2}
          fill="currentColor"
          className={animate ? "spectrum-bar" : ""}
          style={animate ? { animationDelay: `${i * 0.15}s` } : undefined}
        />
      ))}
    </svg>
  );
}
