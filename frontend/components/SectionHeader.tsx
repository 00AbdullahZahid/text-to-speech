type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF8A3D]" />
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-[#15172B] sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[#676C89]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
