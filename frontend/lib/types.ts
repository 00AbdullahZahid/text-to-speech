export type Generation = {
  filename: string;
  voice: string;
  voiceId: string;
  speed: number;
  text: string;
  size: number;
  created_at: string;
  storage_path?: string;
  audio_url?: string;
};

export type VoiceOption = {
  id: string;
  name: string;
};

export type AppConfig = {
  voices: VoiceOption[];
  minTextLength: number;
  maxTextLength: number;
  minSpeed: number;
  maxSpeed: number;
};
