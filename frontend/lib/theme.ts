export type ThemeMode = "light" | "dark";

const THEME_KEY = "voxa-theme";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function resolveTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function initTheme() {
  applyTheme(resolveTheme());
}

export function toggleTheme(): ThemeMode {
  const next = resolveTheme() === "dark" ? "light" : "dark";
  window.localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  return next;
}

export function setTheme(mode: ThemeMode) {
  window.localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
}

export type StudioDefaults = {
  voiceId: string;
  speed: number;
  format: string;
};

const DEFAULTS_KEY = "voxa-studio-defaults";

export function loadStudioDefaults(): Partial<StudioDefaults> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DEFAULTS_KEY) ?? "null");
    if (parsed && typeof parsed === "object") {
      return {
        voiceId: typeof parsed.voiceId === "string" ? parsed.voiceId : undefined,
        speed: typeof parsed.speed === "number" ? parsed.speed : undefined,
        format: typeof parsed.format === "string" ? parsed.format : undefined,
      };
    }
  } catch {}
  return {};
}

export function saveStudioDefaults(values: StudioDefaults) {
  window.localStorage.setItem(DEFAULTS_KEY, JSON.stringify(values));
}