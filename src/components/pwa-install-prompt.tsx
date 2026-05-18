"use client";

import { useEffect, useState } from "react";
import {
  dismissInstallPrompt,
  isIOSDevice,
  isStandalonePwa,
  requestPwaInstall,
  setDeferredInstallPrompt,
  type BeforeInstallPromptEvent,
  wasInstallDismissed
} from "@/lib/pwa-install";
import styles from "./pwa-install-prompt.module.css";

function isInAppExperience() {
  return typeof document !== "undefined" && !!document.querySelector(".app-shell");
}

function readVisualState() {
  if (typeof document === "undefined") return { theme: "light", accent: "cobalt" };
  const root = document.querySelector(".root") as HTMLElement | null;
  const storedAccent = window.localStorage.getItem("forkfirst:accent");
  let parsedAccent = storedAccent;
  try {
    parsedAccent = storedAccent?.startsWith("\"") ? JSON.parse(storedAccent) as string : storedAccent;
  } catch {
    parsedAccent = storedAccent;
  }
  return {
    theme: root?.dataset.theme === "dark" ? "dark" : "light",
    accent: root?.dataset.accent || parsedAccent || "cobalt"
  };
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [visualState, setVisualState] = useState({ theme: "light", accent: "cobalt" });

  useEffect(() => {
    if (wasInstallDismissed()) {
      return;
    }

    const iosDevice = isIOSDevice();
    setIsIOS(iosDevice);

    if (isStandalonePwa()) {
      return;
    }

    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let installReady = iosDevice;

    const showAfterPageSettles = () => {
      if (showTimer) clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        setVisualState(readVisualState());
        setShowPrompt(installReady && isInAppExperience());
      }, 7000);
    };

    const observer = new MutationObserver(() => {
      setVisualState(readVisualState());
      if (!isInAppExperience()) {
        setShowPrompt(false);
        return;
      }
      if (installReady) showAfterPageSettles();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-theme", "data-accent"] });

    // Android: listen for beforeinstallprompt
    if (!iosDevice) {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
        installReady = true;
        showAfterPageSettles();
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      return () => {
        observer.disconnect();
        if (showTimer) clearTimeout(showTimer);
        setDeferredInstallPrompt(null);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    } else {
      // iOS: show if not standalone
      showAfterPageSettles();
      return () => {
        observer.disconnect();
        if (showTimer) clearTimeout(showTimer);
      };
    }
  }, []);

  const handleInstall = async () => {
    const outcome = await requestPwaInstall();
    if (outcome === "accepted" || outcome === "installed") {
      setShowPrompt(false);
    } else if (outcome === "ios" || isIOS) {
      alert("Tap the Share button below, then select 'Add to Home Screen'");
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className={styles.banner} data-theme={visualState.theme} data-accent={visualState.accent}>
      <button className={styles.close} type="button" onClick={handleDismiss} aria-label="Hide install prompt">
        ×
      </button>
      <div className={styles.content}>
        <span className={styles.badge}>Optional</span>
        <span className={styles.text}>
          {isIOS ? "Add to Home Screen" : "Install app"}
        </span>
      </div>
      <div className={styles.actions}>
        <button className={styles.install} onClick={handleInstall}>
          {isIOS ? "How" : "Install"}
        </button>
        <button className={styles.dismiss} onClick={handleDismiss}>
          Later
        </button>
      </div>
    </div>
  );
}


