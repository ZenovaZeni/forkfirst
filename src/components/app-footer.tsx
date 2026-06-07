"use client";

const REPOSITORY_URL = process.env.NEXT_PUBLIC_REPOSITORY_URL ?? "";
const SECURITY_ADVISORY_URL = process.env.NEXT_PUBLIC_SECURITY_ADVISORY_URL ?? "";
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? "";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>ForkFirst - MIT</span>
      {REPOSITORY_URL ? (
        <>
          <span> - </span>
          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </>
      ) : null}
      {SUPPORT_URL ? (
        <>
          <span> - </span>
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
            Support
          </a>
        </>
      ) : null}
      {SUPPORT_EMAIL ? (
        <>
          <span> - </span>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>
        </>
      ) : null}
      <span> - </span>
      <a href="/security">Security</a>
      <span> - </span>
      <a href="/privacy">Privacy</a>
      {SECURITY_ADVISORY_URL ? (
        <>
          <span> - </span>
          <a href={SECURITY_ADVISORY_URL} target="_blank" rel="noreferrer">
            Report security issue
          </a>
        </>
      ) : null}
    </footer>
  );
}
