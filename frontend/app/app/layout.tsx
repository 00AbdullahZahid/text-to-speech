"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthGuard } from "../../components/auth/AuthGuard";
import { Sidebar, BrandLogo, type NavItem } from "../../components/Sidebar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { createClient } from "../../lib/auth";

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
    router.push("/login");
  }

  const isHrefActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  const items: NavItem[] = [
    { href: "/app", label: "TTS Studio", active: isHrefActive("/app"), icon: <span /> },
    { href: "/app/ocr", label: "Image OCR", active: isHrefActive("/app/ocr"), icon: <span /> },
    { href: "/app/history", label: "History", active: isHrefActive("/app/history"), icon: <span /> },
  ];

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-y-0 left-0 flex w-[280px] flex-col bg-[#0B1739] shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <BrandLogo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center rounded-xl px-4 py-3 text-[13px] font-medium transition ${
                    item.active ? "bg-white/[0.08] text-white" : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/[0.06] px-3 py-2">
          <Link
            href="/app/settings"
            onClick={onClose}
            className={`flex items-center rounded-xl px-4 py-3 text-[13px] font-medium transition ${
              pathname.startsWith("/app/settings") ? "bg-white/[0.08] text-white" : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
            }`}
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center rounded-xl px-4 py-3 text-[13px] font-medium text-white/50 transition hover:bg-white/[0.05] hover:text-white/80"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#EFF6FF] px-4 lg:hidden dark:border-[#2A3D6B] dark:bg-[#0B1739]">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0B1739] transition hover:bg-[#DBEAFE] dark:text-white dark:hover:bg-white/[0.06]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
      <span className="font-display text-[17px] font-bold tracking-tight text-[#0B1739] dark:text-white">Voxa</span>
      <ThemeToggle className="!text-[#64748B] dark:!text-white/70" />
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#EFF6FF] dark:bg-[#0B1739]">
        <Sidebar />
        <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}