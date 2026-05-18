import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./redesign.css";
import "./redesign-overrides.css";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const SITE_DESCRIPTION =
  "Find the best repo to fork, then hand the plan to your AI.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ForkFirst - idea check, before you build",
  description: SITE_DESCRIPTION,
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
    title: "ForkFirst - idea check, before you build",
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
  themeColor: "#F6F4EF"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
