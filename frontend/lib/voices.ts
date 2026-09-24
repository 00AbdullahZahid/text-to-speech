export const VOICE_NAMES: Record<string, string> = {
  af_alloy: "Alloy",
  af_bella: "Bella",
  af_heart: "Heart",
  af_nova: "Nova",
  am_adam: "Adam",
  am_michael: "Michael",
  am_echo: "Echo",
  am_onyx: "Onyx",
  bm_daniel: "Daniel",
};

export function voiceName(id: string, options?: { id: string; name: string }[]): string {
  if (!id) return "";
  const fromOptions = options?.find((o) => o.id === id)?.name;
  return fromOptions || VOICE_NAMES[id] || id;
}

export function voiceOptionsFallback(): { id: string; name: string }[] {
  return Object.entries(VOICE_NAMES).map(([id, name]) => ({ id, name }));
}