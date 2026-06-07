import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ForkFirst Builder Handoff";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function titleCase(str: string): string {
  return str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function OGImage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idea = titleCase(slug).slice(0, 80);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #f7f3ea 0%, #efe6d4 100%)",
          padding: "64px 72px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative"
        }}
      >
        {/* Top-left wordmark */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#c0522a",
            letterSpacing: "-0.02em",
            marginBottom: "auto"
          }}
        >
          ForkFirst
        </div>

        {/* Center content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 48 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#c0522a",
              opacity: 0.85
            }}
          >
            Builder Handoff
          </div>
          <div
            style={{
              fontSize: idea.length > 50 ? 42 : 54,
              fontWeight: 800,
              color: "#1a1008",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 900
            }}
          >
            {idea}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#6b5030",
              marginTop: 8
            }}
          >
            Full context pack for your AI builder — no backend, no server.
          </div>
        </div>

        {/* Bottom rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "2px solid rgba(180, 130, 80, 0.25)"
          }}
        >
          <span style={{ fontSize: 18, color: "#9b7848", fontWeight: 600 }}>
            forkfirst.dev - find the repo foundation first
          </span>
          <span
            style={{
              background: "#c0522a",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              padding: "8px 20px",
              borderRadius: 8
            }}
          >
            Try for free
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
