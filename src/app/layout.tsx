import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./redesign.css";
import "./redesign-overrides.css";
import { Analytics } from "@/components/analytics";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const SITE_DESCRIPTION =
  "Chat through your app idea, find a working GitHub foundation, and give your AI builder the repo, prompt, and files it needs.";

const APPLE_SPLASH_IMAGES = [
  { url: "/brand/splash/apple-splash-iphone-se-640x1136.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-se-landscape-1136x640.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-iphone-8-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-8-landscape-1334x750.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-iphone-11-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-11-landscape-1792x828.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-iphone-x-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-x-landscape-2436x1125.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-iphone-12-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-12-landscape-2532x1170.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-iphone-14-pro-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-14-pro-landscape-2556x1179.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-iphone-xs-max-1242x2688.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-xs-max-landscape-2688x1242.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-iphone-12-pro-max-1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-12-pro-max-landscape-2778x1284.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-iphone-14-pro-max-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-iphone-14-pro-max-landscape-2796x1290.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-ipad-mini-1536x2048.png", media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-ipad-mini-landscape-2048x1536.png", media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-ipad-10-1620x2160.png", media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-ipad-10-landscape-2160x1620.png", media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-ipad-pro-10-5-1668x2224.png", media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-ipad-pro-10-5-landscape-2224x1668.png", media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-ipad-pro-11-1668x2388.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-ipad-pro-11-landscape-2388x1668.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
  { url: "/brand/splash/apple-splash-ipad-pro-12-9-2048x2732.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
  { url: "/brand/splash/apple-splash-ipad-pro-12-9-landscape-2732x2048.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" }
];

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
    startupImage: APPLE_SPLASH_IMAGES,
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
  themeColor: "#F4F0E6"
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
