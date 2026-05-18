import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { estimateHandoffTokens, formatTokensShort, logHandoffGenerated, loadSavings } from "./savings";

const mockStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  clear: () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  length: 0,
  key: () => null
};

// Mock window object with localStorage
Object.defineProperty(global, "window", {
  value: {
    localStorage: localStorageMock
  },
  writable: true
});

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true
});

describe("Token Savings", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe("estimateHandoffTokens", () => {
    it("should return 0 for empty markdown", () => {
      expect(estimateHandoffTokens("")).toBe(0);
    });

    it("should estimate tokens for small handoff", () => {
      const markdown = "a".repeat(2000); // ~500 tokens
      expect(estimateHandoffTokens(markdown)).toBe(500);
    });

    it("should handle realistic handoff size", () => {
      const markdown = "a".repeat(8000); // ~2000 tokens
      expect(estimateHandoffTokens(markdown)).toBe(2000);
    });
  });

  describe("formatTokensShort", () => {
    it("should handle zero", () => {
      expect(formatTokensShort(0)).toBe("0");
    });

    it("should format thousands", () => {
      expect(formatTokensShort(1234)).toBe("1.2k");
      expect(formatTokensShort(12340)).toBe("12.3k");
      expect(formatTokensShort(1000)).toBe("1.0k");
    });

    it("should format millions", () => {
      expect(formatTokensShort(1234000)).toBe("1.2M");
      expect(formatTokensShort(1500000)).toBe("1.5M");
    });

    it("should handle small numbers", () => {
      expect(formatTokensShort(100)).toBe("100");
      expect(formatTokensShort(999)).toBe("999");
    });
  });

  describe("logHandoffGenerated", () => {
    it("should initialize with 0 saves", () => {
      const initial = loadSavings();
      expect(initial.count).toBe(0);
      expect(initial.totalHandoffTokens).toBe(0);
    });

    it("should increment count and total savings", () => {
      const markdown = "a".repeat(8000);
      const result = logHandoffGenerated(markdown);
      expect(result.count).toBe(1);
      expect(result.totalHandoffTokens).toBe(2000);
    });

    it("should accumulate across multiple calls", () => {
      const md1 = "a".repeat(4000); // ~1000 tokens
      logHandoffGenerated(md1);

      const md2 = "b".repeat(8000); // ~2000 tokens
      const result = logHandoffGenerated(md2);

      expect(result.count).toBe(2);
      expect(result.totalHandoffTokens).toBe(3000);
    });

    it("should persist to localStorage", () => {
      const markdown = "test".repeat(2000);
      logHandoffGenerated(markdown);

      const loaded = loadSavings();
      expect(loaded.count).toBe(1);
      expect(loaded.totalHandoffTokens).toBeGreaterThan(0);
    });
  });
});
