"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TrendingSection } from "@/components/trending-section";
import type { UserKeys } from "@/components/key-settings";
import {
  DEFAULT_REDESIGN_USER_KEYS,
  readFeatureStorage,
  readJsonValue,
  REDESIGN_STORAGE_KEYS
} from "@/lib/redesign/feature-model";

export default function TrendingPage() {
  const [theme, setTheme] = useState<"paper" | "ink" | null>(null);
  const [githubToken, setGithubToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Read theme
    const storedTheme = window.localStorage.getItem("forkfirst:theme") ?? window.localStorage.getItem("open-repo:theme");
    setTheme(storedTheme === "ink" ? "ink" : "paper");

    // Read GitHub token from the same session-by-default storage path as Settings.
    try {
      const storage = readFeatureStorage(window.localStorage);
      const sessionKeys = readJsonValue<UserKeys>(window.sessionStorage, REDESIGN_STORAGE_KEYS.keys, DEFAULT_REDESIGN_USER_KEYS);
      const parsed = storage.rememberKeys ? storage.keys : sessionKeys;
      if (parsed.githubToken) setGithubToken(parsed.githubToken);
    } catch {
      // ignore
    }
  }, []);

  if (theme === null) return null; // avoid flash before theme loads

  return (
    <div
      className="app-shell"
      data-theme={theme}
      style={{ display: "block", height: "auto", minHeight: "100vh", overflow: "auto" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
        {/* Topbar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "20px 0",
            borderBottom: "1px solid var(--line)",
            marginBottom: 0
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.82rem",
              fontWeight: 650,
              color: "var(--muted)",
              textDecoration: "none",
              padding: "7px 14px",
              border: "1px solid var(--line)",
              borderRadius: 999,
              background: "color-mix(in srgb, var(--panel) 60%, transparent)"
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to ForkFirst
          </Link>
        </header>

        <TrendingSection githubToken={githubToken} fullPage />
      </div>
    </div>
  );
}
