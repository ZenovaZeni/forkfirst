import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./redesign.css";
import "./redesign-overrides.css";
import { Analytics } from "@/components/analytics";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const SITE_DESCRIPTION =
  "Chat through your app idea, find a working GitHub foundation, and give your AI builder the repo, prompt, and files it needs.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ForkFirst - don't make your AI builder start from zero",
  description: SITE_DESCRIPTION,
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ForkFirst"
  },
  icons: {
    icon: [
      { url: "/brand/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon/favicon-16.png", sizes: "16x16", type: "image/png" }
    ],
    shortcut: "/brand/favicon/favicon.svg",
    apple: "/brand/favicon/apple-touch-icon.png"
  },
  openGraph: {
    title: "ForkFirst - don't make your AI builder start from zero",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/brand/social/og-image.png",
        width: 1200,
        height: 630,
        alt: "ForkFirst"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ForkFirst",
    description: SITE_DESCRIPTION,
    images: ["/brand/social/og-image.png"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
  themeColor: "#0A0B0E"
};

const themeBootScript = `
(function () {
  try {
    var allowedAccents = { cobalt: true, ember: true, forest: true, violet: true };
    function readJsonString(key) {
      var value = localStorage.getItem(key);
      if (value === null) return null;
      try {
        var parsed = JSON.parse(value);
        return typeof parsed === "string" ? parsed : null;
      } catch (_) {
        return value;
      }
    }
    var accent = readJsonString("forkfirst:accent") || readJsonString("open-repo:accent") || "cobalt";
    if (!allowedAccents[accent]) accent = "cobalt";
    var rawTheme = localStorage.getItem("forkfirst:theme") || localStorage.getItem("open-repo:theme") || "paper";
    var theme = rawTheme === "ink" || rawTheme === "dark" ? "dark" : "light";
    var root = document.documentElement;
    root.setAttribute("data-accent", accent);
    root.setAttribute("data-theme", theme);
    root.classList.toggle("theme-ink", theme === "dark");
    root.classList.toggle("theme-paper", theme !== "dark");
    function apply() {
      document.querySelectorAll(".root, .app-shell").forEach(function (node) {
        node.setAttribute("data-accent", accent);
        node.setAttribute("data-theme", theme);
        if (node.classList.contains("app-shell")) {
          node.classList.toggle("theme-ink", theme === "dark");
          node.classList.toggle("theme-paper", theme !== "dark");
        }
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, { once: true });
    else apply();
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <Analytics enableVercel={process.env.VERCEL === "1"} />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
