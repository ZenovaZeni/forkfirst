export type BrowserSpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  start: () => void;
  stop: () => void;
};

export type SpeechRecognitionResultLike = {
  resultIndex: number;
  results: ArrayLike<{
    0?: { transcript?: string };
    isFinal?: boolean;
  }>;
};

export type SpeechRecognitionGlobal = {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

export const browserVoiceInputCopy = {
  listening: "Listening...",
  idle: "Browser voice input",
  unsupported: "Voice input is not supported here. Type your idea instead.",
  permissionBlocked: "Microphone permission was blocked. You can still type your idea.",
  startFailed: "Voice input could not start. Check microphone permission, then try again or type.",
  stoppedNoTranscript: "Voice input stopped before a transcript was captured. You can try again or type.",
  privacy: "Browser/device speech service. ForkFirst does not store audio."
} as const;

export function getBrowserSpeechRecognition(source: SpeechRecognitionGlobal): BrowserSpeechRecognitionConstructor | null {
  return source.SpeechRecognition ?? source.webkitSpeechRecognition ?? null;
}

export function mergeSpeechTranscript(current: string, transcript: string) {
  const cleanTranscript = transcript.trim().replace(/\s+/g, " ");
  if (!cleanTranscript) return current;
  if (!current.trim()) return cleanTranscript;
  return `${current.replace(/\s+$/g, "")} ${cleanTranscript}`;
}

export function getSpeechRecognitionErrorMessage(error?: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return browserVoiceInputCopy.permissionBlocked;
  }
  return browserVoiceInputCopy.stoppedNoTranscript;
}
