"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../lib/auth";
import { ThemeToggle } from "./ThemeToggle";

export type NavItem = {
  href: string;
  label: string;
  active: boolean;
  title?: string;
  icon: React.ReactNode;
};

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/app" className="flex items-center gap-3" title="Voxa">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#2563EB]">
        <span className="font-display text-sm font-bold text-white">V</span>
      </div>
      {!compact && (
        <div>
          <span className="font-display text-[17px] font-bold tracking-tight text-white">Voxa</span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">AI Text-to-Speech</p>
        </div>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [collapsed, setCollapsed] = useState(() => typeof window !== "undefined" && localStorage.getItem("voxa-sidebar-collapsed") === "true");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, [supabase]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("voxa-sidebar-collapsed", String(next));
      return next;
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isHrefActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  const navItems: NavItem[] = [
    {
      href: "/app",
      label: "TTS Studio",
      active: isHrefActive("/app"),
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      ),
    },
    {
      href: "/app/ocr",
      label: "Image OCR",
      active: isHrefActive("/app/ocr"),
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="12" cy="13" r="3" />
          <path d="M16 3h-8v4" />
        </svg>
      ),
    },
    {
      href: "/app/history",
      label: "Generation History",
      active: isHrefActive("/app/history"),
      icon: (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  return (
    <aside className={`hidden h-full shrink-0 flex-col bg-sidebar transition-all duration-200 lg:flex ${collapsed ? "w-[72px]" : "w-[260px]"}`}>
      {/* Logo */}
      <div className={`pb-7 pt-6 ${collapsed ? "px-3 flex justify-center" : "px-5"}`}>
        <BrandLogo compact={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">Navigation</p>}
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  collapsed ? "justify-center" : ""
                } ${
                  item.active
                    ? collapsed
                      ? "bg-white/[0.08] text-white"
                      : "border-l-[3px] border-[#2563EB] bg-white/[0.08] pl-[9px] text-white"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                }`}
              >
                <span className="shrink-0 opacity-90">{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Account */}
      <div className="px-3 pb-2">
        {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">Account</p>}
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href="/app/settings"
              title={collapsed ? "Settings" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                collapsed ? "justify-center" : ""
              } ${
                pathname.startsWith("/app/settings")
                  ? collapsed
                    ? "bg-white/[0.08] text-white"
                    : "border-l-[3px] border-[#2563EB] bg-white/[0.08] pl-[9px] text-white"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
              }`}
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              {!collapsed && "Settings"}
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={handleSignOut}
              title={collapsed ? "Sign out" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/50 transition hover:bg-white/[0.05] hover:text-white/80 ${collapsed ? "justify-center" : ""}`}
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!collapsed && "Sign out"}
            </button>
          </li>
        </ul>
      </div>

      {/* Appearance */}
      <div className={`mb-1 border-t border-white/[0.06] ${collapsed ? "px-2 py-2" : "px-3 py-2"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-3 px-2"}`}>
          {!collapsed && (
            <span className="text-[11px] font-medium text-white/40">Appearance</span>
          )}
          <ThemeToggle className={collapsed ? "" : "!text-white/60"} />
        </div>
      </div>

      {/* User */}
      {!collapsed && (
        <div className="border-t border-white/[0.06] px-5 py-4">
          <p className="text-[10px] text-white/30">Signed in as</p>
          <p className="mt-0.5 truncate text-[11px] text-white/60">{email}</p>
        </div>
      )}

      {/* Toggle */}
      <div className={`border-t border-white/[0.06] ${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`flex w-full items-center rounded-xl py-2.5 text-[13px] font-medium text-white/40 transition hover:bg-white/[0.05] hover:text-white/70 ${collapsed ? "justify-center" : "gap-3 px-3"}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}