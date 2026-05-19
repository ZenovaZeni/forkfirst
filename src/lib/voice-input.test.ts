import { describe, expect, test } from "vitest";
import {
  browserVoiceInputCopy,
  getBrowserSpeechRecognition,
  getSpeechRecognitionErrorMessage,
  mergeSpeechTranscript
} from "./voice-input";

describe("browser voice input", () => {
  test("merges speech transcript into editable text without auto-submit behavior", () => {
    expect(mergeSpeechTranscript("", " build a budget tracker ")).toBe("build a budget tracker");
    expect(mergeSpeechTranscript("Find repos for", " a local CRM")).toBe("Find repos for a local CRM");
    expect(mergeSpeechTranscript("Find repos for ", "a local CRM")).toBe("Find repos for a local CRM");
  });

  test("detects prefixed browser speech recognition support", () => {
    class SpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "en-US";
      onend = null;
      onerror = null;
      onresult = null;
      start() {}
      stop() {}
    }
    expect(getBrowserSpeechRecognition({ SpeechRecognition })).toBe(SpeechRecognition);
    expect(getBrowserSpeechRecognition({ webkitSpeechRecognition: SpeechRecognition })).toBe(SpeechRecognition);
    expect(getBrowserSpeechRecognition({})).toBeNull();
  });

  test("uses honest support and privacy copy", () => {
    expect(browserVoiceInputCopy.unsupported).toContain("Voice input is not supported");
    expect(browserVoiceInputCopy.permissionBlocked).toContain("Microphone permission was blocked");
    expect(browserVoiceInputCopy.privacy).toContain("Browser/device speech service");
    expect(browserVoiceInputCopy.privacy).toContain("ForkFirst does not store audio");
  });

  test("maps browser speech recognition errors to useful user copy", () => {
    expect(getSpeechRecognitionErrorMessage("not-allowed")).toBe(browserVoiceInputCopy.permissionBlocked);
    expect(getSpeechRecognitionErrorMessage("service-not-allowed")).toBe(browserVoiceInputCopy.permissionBlocked);
    expect(getSpeechRecognitionErrorMessage("no-speech")).toBe(browserVoiceInputCopy.stoppedNoTranscript);
  });
});
