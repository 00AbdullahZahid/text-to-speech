import Link from "next/link";

const NAVY = "#0B1739";
const BLUE = "#2563EB";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* ── Floating Navbar ───────────────────────────────── */}
      <header className="fixed top-4 z-50 w-full px-4">
        <div
          className="mx-auto max-w-6xl rounded-2xl shadow-lg"
          style={{ backgroundColor: NAVY }}
        >
          <div className="flex h-16 items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: BLUE }}
              >
                <span className="text-sm font-bold text-white">V</span>
              </div>
              <span className="font-display text-lg font-bold text-white">
                Voxa
              </span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <a
                href="/#features"
                className="text-[13px] font-medium text-white/70 transition hover:text-white"
              >
                Features
              </a>
              <a
                href="/#how-it-works"
                className="text-[13px] font-medium text-white/70 transition hover:text-white"
              >
                How it works
              </a>
              <a
                href="/#languages"
                className="text-[13px] font-medium text-white/70 transition hover:text-white"
              >
                Languages
              </a>
            </nav>

            <div className="hidden items-center gap-4 md:flex">
              <Link
                href="/login"
                className="text-[13px] font-medium text-white/70 transition hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: BLUE }}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── 404 Content ──────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-20">
        {/* Circle */}
        <div className="flex h-36 w-36 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-50">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
              Page not found
            </p>
            <p className="mt-0.5 font-display text-[52px] font-extrabold leading-none text-[#0F172A]">
              404
            </p>
          </div>
        </div>

        {/* Text */}
        <h1 className="mt-8 text-center font-display text-[26px] font-bold tracking-tight text-[#0F172A] sm:text-[30px]">
          Looks like this voice went missing.
        </h1>
        <p className="mt-3 max-w-md text-center text-[15px] leading-relaxed text-[#64748B]">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14px] font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-[14px] font-semibold text-[#0F172A] transition hover:bg-gray-50"
          >
            Open TTS Studio
          </Link>
        </div>
      </main>

      {/* ── Minimal Footer ────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <p className="text-[12px] text-[#94A3B8]">
            Voxa &middot; AI Text-to-Speech
          </p>
          <p className="text-[12px] text-[#94A3B8]">&copy; 2026 Voxa</p>
        </div>
      </footer>
    </div>
  );
}
