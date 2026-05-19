import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ForkFirstLogo } from "@/components/forkfirst-logo";

export const metadata: Metadata = {
  title: "ForkFirst Security Model",
  description: "How ForkFirst handles BYOK API keys, hosted usage, local usage, storage, and known risks."
};

const trustCards = [
  {
    title: "No accounts",
    body: "ForkFirst does not tie keys, searches, or handoffs to a hosted user account."
  },
  {
    title: "Session-only by default",
    body: "Keys live in browser session storage unless the user opts into Remember keys."
  },
  {
    title: "No server-side key storage",
    body: "API keys are not intentionally logged, written to SQLite, or persisted on the server."
  },
  {
    title: "Provider-bound requests",
    body: "GitHub tokens go to GitHub. AI keys go to the selected AI provider, only for actions the user triggers."
  },
  {
    title: "Open source and verifiable",
    body: "Users can inspect the code, run it locally, and confirm the request flow themselves."
  }
];

const builderCards = ["Claude Code", "Codex", "Cursor", "Replit", "Lovable", "v0", "Gemini CLI", "Markdown"];
const securityAdvisoryUrl = "https://github.com/ZenovaZeni/forkfirst/security/advisories/new";
const supportEmail = "support@zenovaai.com";

const sectionStyle = {
  borderTop: "1px solid var(--line)",
  paddingTop: 34,
  marginTop: 42
};

function ForkFirstWordmark() {
  return (
    <span className="legal-page__wordmark" aria-label="ForkFirst">
      <ForkFirstLogo />
      <span className="legal-page__wordmark-text">
        <span>Fork</span>
        <span>First</span>
      </span>
    </span>
  );
}

function Highlight({ children }: { children: ReactNode }) {
  return <span className="legal-page__highlight">{children}</span>;
}

export default function SecurityPage() {
  return (
    <div className="legal-page legal-page--security">
      <main className="legal-page__shell">
      <Link className="legal-page__brand" href="/">
        <ForkFirstWordmark />
      </Link>
      <p className="legal-page__eyebrow">
        Open source and BYOK first
      </p>
      <h1 className="legal-page__title">
        Your keys stay under your control.
      </h1>
      <p className="legal-page__lede">
        ForkFirst is open source, BYOK, and <Highlight>session-only by default</Highlight>. We <Highlight>do not use accounts</Highlight>, <Highlight>do not store API keys
        server-side</Highlight>, and <Highlight>only forward keys to GitHub or your selected AI provider when you trigger a request</Highlight>.
      </p>
      <p style={{ margin: "22px 0 0" }}>
        <a href={securityAdvisoryUrl} target="_blank" rel="noreferrer">
          Report a security issue privately
        </a>
        <span> · </span>
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>

      <div className="legal-page__trust-grid">
        {trustCards.map((card) => (
          <article className="legal-page__trust-card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </div>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Demo mode and optional keys</h2>
        <ul>
          <li><Highlight>Demo mode works without keys</Highlight>, so users can try ForkFirst before pasting secrets.</li>
          <li>A <Highlight>GitHub token is optional</Highlight> and improves repo search limits and metadata.</li>
          <li>An <Highlight>AI provider key is optional</Highlight> and improves summaries, verdicts, follow-up chat, and handoffs.</li>
          <li>Keys are <Highlight>session-only by default</Highlight>; persistent local storage is opt-in.</li>
          <li>Use <Highlight>dedicated, revocable keys with usage limits</Highlight>.</li>
          <li>Hosted mode requires trusting the ForkFirst deployment while requests are in flight. For maximum control, clone and run ForkFirst locally.</li>
        </ul>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Hosted website</h2>
        <p>
          On the public hosted site, <Highlight>keys you enter in the browser are sent to ForkFirst API routes only for actions you
          trigger</Highlight>, such as verification, repo research, chat, or live trending with a GitHub token. The route forwards
          the key to GitHub or your selected AI provider. <Highlight>Keys are not intentionally logged or stored server-side.</Highlight>
        </p>
        <p>
          <Highlight>Default key storage is session-only.</Highlight> Remember keys is opt-in and stores keys in this browser&apos;s localStorage.
          Browser extensions, malware, someone with your unlocked device, or any future XSS bug could read browser
          storage, so use scoped, revocable keys with spend limits.
        </p>
        <p>
          Saved chats, saved repos, saved Build Packs, prompt packs, and usage entries are stored in browser
          localStorage by default. <Highlight>ForkFirst does not attach that data to a hosted user account.</Highlight>
        </p>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Rate limits and abuse controls</h2>
        <p>
          ForkFirst includes <Highlight>per-IP rate limits on key verification, repo research, chat, trending, and idea refinement</Highlight>.
          Local development uses in-memory limits. Hosted deployments should set `UPSTASH_REDIS_REST_URL` and
          `UPSTASH_REDIS_REST_TOKEN` so limits are durable across serverless instances and restarts.
        </p>
        <p>
          Rate limits reduce casual abuse; they <Highlight>do not replace auth, bot protection, WAF rules, provider spend limits, or
          careful monitoring</Highlight> if you run a high-traffic public deployment.
        </p>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Privacy-safe analytics</h2>
        <p>
          ForkFirst may use Vercel Web Analytics for basic production traffic numbers and Microsoft Clarity for masked
          heatmaps/session diagnostics. Analytics events describe product actions, such as starting a check or
          downloading a handoff, but <Highlight>should not include raw idea text, API keys, README text, or handoff contents.</Highlight>
        </p>
        <p>
          Sensitive app surfaces such as chat transcripts, repo details, README excerpts, handoff files, and key settings
          are <Highlight>marked for Clarity masking</Highlight>. If you run your own deployment, keep Clarity masking strict and do not add
          analytics that captures user-entered prompts or secrets.
        </p>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Downloaded repo / local run</h2>
        <p>
          If you clone the repo and run ForkFirst locally, the browser still sends keys to the Next.js API route, but
          that route is running on your own machine. <Highlight>Your keys are then forwarded directly from your machine to GitHub
          or your selected AI provider.</Highlight>
        </p>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Works with your AI builder</h2>
        <p style={{ maxWidth: 720 }}>
          ForkFirst exports Markdown handoffs instead of locking you into one coding tool. The same repo-first packet can
          guide the builders you already use.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 20 }}>
          {builderCards.map((builder) => (
            <div className="legal-page__builder-card" key={builder}>
              {builder}
            </div>
          ))}
        </div>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>What we do not claim</h2>
        <ul>
          <li>We do not say <Highlight>keys never leave your browser</Highlight> on hosted usage.</li>
          <li>We do not say <Highlight>everything stays on device</Highlight>.</li>
          <li>We do not say local AI stays local unless the user is actually using a <Highlight>trusted local provider</Highlight>.</li>
          <li>We do not say any key-handling system is <Highlight>100% safe</Highlight>.</li>
        </ul>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Recommended key setup</h2>
        <ul>
          <li>Use a GitHub fine-grained token with the <Highlight>minimum public-repo access</Highlight> needed for search metadata.</li>
          <li>Use provider keys with <Highlight>spending limits, short rotation windows, and revocation ready</Highlight>.</li>
          <li>Do not use custom AI base URLs unless you trust the operator; <Highlight>that server receives your AI key</Highlight>.</li>
          <li><Highlight>Clear browser data after use</Highlight> on shared machines.</li>
        </ul>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Dependency audit</h2>
        <p>
          <Highlight>`npm audit --omit=dev` is expected to pass before launch.</Highlight> ForkFirst tracks dependency security notes in
          `docs/security-advisories.md` and should avoid forced audit fixes that downgrade core framework packages without review.
        </p>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Remaining risks</h2>
        <p>
          A hosted BYOK app can <Highlight>reduce risk, but it cannot eliminate it</Highlight>. Risks include malicious browser extensions,
          compromised devices, provider-side logging, network or device malware, XSS bugs, supply-chain bugs, phishing
          lookalikes, and users pasting <Highlight>overly powerful API keys</Highlight>. Treat this page as a <Highlight>living security contract</Highlight>.
        </p>
      </section>

      <section className="legal-page__section" style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Report a vulnerability</h2>
        <p>
          Please <Highlight>do not open a public issue with secrets or exploit details</Highlight>. Use a private GitHub Security Advisory so
          the maintainer can fix and disclose responsibly, or email <Highlight>{supportEmail}</Highlight>.
        </p>
        <p>
          <a href={securityAdvisoryUrl} target="_blank" rel="noreferrer">
            Open a private security advisory
          </a>
        </p>
      </section>
      </main>
    </div>
  );
}
