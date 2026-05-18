"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeHandoff } from "@/lib/handoff/share-url";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function titleCase(str: string): string {
  return str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HandoffSharePage({ params }: PageProps) {
  const [resolvedSlug, setResolvedSlug] = useState<string>("");
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [idea, setIdea] = useState<string>("");
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"paper" | "ink">("paper");

  // Resolve async params
  useEffect(() => {
    params.then(({ slug }) => setResolvedSlug(slug));
  }, [params]);

  // Read theme preference
  useEffect(() => {
    const stored = window.localStorage.getItem("forkfirst:theme") ?? window.localStorage.getItem("open-repo:theme");
    if (stored === "ink") setTheme("ink");
  }, []);

  // Decode the hash fragment
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      setError(true);
      return;
    }
    decodeHandoff(hash).then((result) => {
      if (!result) {
        setError(true);
        return;
      }
      setMarkdown(result.markdown);
      setIdea(result.idea);
    });
  }, []);

  async function copyMarkdown() {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard blocked
    }
  }

  function openInForkFirst() {
    const hash = window.location.hash.replace(/^#/, "");
    window.open(`/?handoff=${encodeURIComponent(hash)}`, "_blank");
  }

  const displayIdea = idea || titleCase(resolvedSlug);
  const isDark = theme === "ink";

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "#1a1a1a" : "#f7f3ea",
          color: isDark ? "#e8e0d0" : "#1a1a1a",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "2rem",
          textAlign: "center"
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          This shared handoff is invalid or expired
        </h1>
        <p style={{ color: isDark ? "#a09070" : "#6b5c3e", marginBottom: "1.5rem" }}>
          The link may be incomplete or the payload was too large to encode.
        </p>
        <Link
          href="/"
          style={{
            background: "#c0522a",
            color: "#fff",
            padding: "0.6rem 1.4rem",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem"
          }}
        >
          Make your own
        </Link>
      </div>
    );
  }

  if (markdown === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "#1a1a1a" : "#f7f3ea",
          color: isDark ? "#a09070" : "#6b5c3e",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        Loading handoff…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#1a1a1a" : "#f7f3ea",
        color: isDark ? "#e8e0d0" : "#1a1a1a",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem 1rem"
      }}
    >
      {/* Document */}
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: isDark ? "#242424" : "#fffdf8",
          borderRadius: "12px",
          boxShadow: isDark
            ? "0 2px 24px rgba(0,0,0,0.5)"
            : "0 2px 24px rgba(120,80,20,0.10)",
          padding: "2.5rem 2.5rem 2rem",
          border: isDark ? "1px solid #333" : "1px solid #e8dcc8"
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#c0522a",
                marginBottom: "0.25rem",
                display: "block"
              }}
            >
              Builder Handoff
            </span>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                margin: 0,
                color: isDark ? "#e8e0d0" : "#1a1a1a"
              }}
            >
              {displayIdea}
            </h1>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={copyMarkdown}
              style={{
                background: isDark ? "#333" : "#f0e8d8",
                color: isDark ? "#e8e0d0" : "#1a1a1a",
                border: isDark ? "1px solid #444" : "1px solid #c8b898",
                borderRadius: "6px",
                padding: "0.45rem 0.9rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {copied ? "Copied!" : "Copy markdown"}
            </button>
            <button
              onClick={openInForkFirst}
              style={{
                background: "#c0522a",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "0.45rem 0.9rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Open in ForkFirst
            </button>
          </div>
        </div>

        {/* Markdown content — rendered as preformatted text for v1 */}
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "ui-monospace, 'Cascadia Mono', 'Fira Code', monospace",
            fontSize: "0.82rem",
            lineHeight: 1.7,
            color: isDark ? "#c8bfaf" : "#2a2018",
            background: isDark ? "#1e1e1e" : "#f4efe4",
            border: isDark ? "1px solid #333" : "1px solid #e0d4bc",
            borderRadius: "8px",
            padding: "1.25rem 1.5rem",
            margin: 0,
            overflowX: "auto"
          }}
        >
          {markdown}
        </pre>

        {/* Footer */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.25rem",
            borderTop: isDark ? "1px solid #333" : "1px solid #e8dcc8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem"
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              color: isDark ? "#6b6050" : "#9b8060",
              margin: 0
            }}
          >
            Made with{" "}
            <strong style={{ color: "#c0522a" }}>ForkFirst</strong> — Find what&apos;s already out there.
          </p>
          <Link
            href="/"
            style={{
              fontSize: "0.8rem",
              color: "#c0522a",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Try it free →
          </Link>
        </div>
      </div>
    </div>
  );
}
