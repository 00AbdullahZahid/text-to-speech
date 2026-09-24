export type AudioFormat = "wav" | "mp3" | "ogg" | "flac";

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
  format?: AudioFormat;
  has_subtitles?: boolean;
};

export type VoiceOption = {
  id: string;
  name: string;
};

export type FormatOption = {
  id: AudioFormat;
  label: string;
  ext: string;
  mime: string;
};

export type AppConfig = {
  voices: VoiceOption[];
  minTextLength: number;
  maxTextWords: number;
  maxTextChars?: number;
  minSpeed: number;
  maxSpeed: number;
  outputsPath: string;
  formats: FormatOption[];
  maxBatchItems: number;
};

export type Preset = {
  id: number;
  name: string;
  voiceId: string;
  speed: number;
  format: AudioFormat;
};

export type BatchItemResult = {
  index: number;
  filename: string;
  format: AudioFormat;
  success: boolean;
  error?: string;
  hasSubtitles?: boolean;
};

export type BatchResponse = {
  results: BatchItemResult[];
  total: number;
};

export type JobStatus = "queued" | "running" | "completed" | "failed";

export type JobInfo = {
  id: string;
  userId?: string;
  kind: "single" | "batch";
  status: JobStatus;
  text?: string | null;
  payload?: {
    text?: string;
    voiceId?: string;
    speed?: number;
    format?: AudioFormat;
    items?: {
      text: string;
      voiceId: string;
      speed: number;
      format: AudioFormat;
    }[];
  };
  results?: { filename: string; format: AudioFormat; hasSubtitles?: boolean } | BatchResponse | null;
  progress?: { done: number; total: number } | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};
