export function Header() {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#DCE9FB] bg-[#DBEAFE]">
          <img src="/logo-512.png" alt="Voxa logo" className="h-10 w-10 rounded-xl" />
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#2563EB]">
            AI voice studio
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#15172B] sm:text-4xl">
            Voxa
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[#676C89] sm:text-base">
            Turn a script into a natural voiceover in seconds.
          </p>
        </div>
      </div>
    </header>
  );
}
