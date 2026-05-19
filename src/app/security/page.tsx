import type { Metadata } from "next";
import Link from "next/link";

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
const accent = "#4f6dff";
const pageInk = "#f7f1e8";
const mutedInk = "#aeb6c3";
const line = "#2c313b";
const cardBg = "#fbf8ef";
const cardBorder = "#ded6c4";

const sectionStyle = {
  borderTop: `1px solid ${line}`,
  paddingTop: 34,
  marginTop: 42
};

export default function SecurityPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d1016" }}>
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 20px 80px", lineHeight: 1.6, color: pageInk }}>
      <Link href="/" style={{ color: accent, fontWeight: 750, textDecoration: "none" }}>ForkFirst</Link>
      <p style={{ margin: "48px 0 10px", color: accent, fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        Open source and BYOK first
      </p>
      <h1 style={{ fontSize: "clamp(42px, 7vw, 82px)", lineHeight: 0.92, letterSpacing: 0, margin: "0 0 20px" }}>
        Your keys stay under your control.
      </h1>
      <p style={{ fontSize: 19, color: mutedInk, maxWidth: 720, margin: 0 }}>
        ForkFirst is open source, BYOK, and session-only by default. We do not use accounts, do not store API keys
        server-side, and only forward keys to GitHub or your selected AI provider when you trigger a request.
      </p>
      <p style={{ margin: "22px 0 0" }}>
        <a href={securityAdvisoryUrl} target="_blank" rel="noreferrer" style={{ color: accent, fontWeight: 850 }}>
          Report a security issue privately
        </a>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 42 }}>
        {trustCards.map((card) => (
          <article key={card.title} style={{ border: `1px solid ${cardBorder}`, borderRadius: 18, padding: 20, background: cardBg, color: "#08090d" }}>
            <h2 style={{ fontSize: 19, lineHeight: 1.15, margin: "0 0 10px", color: "#08090d" }}>{card.title}</h2>
            <p style={{ margin: 0, color: "#68707d", fontSize: 14 }}>{card.body}</p>
          </article>
        ))}
      </div>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Hosted website</h2>
        <p>
          On the public hosted site, keys you enter in the browser are sent to ForkFirst API routes only for actions you
          trigger, such as verification, repo research, chat, or live trending with a GitHub token. The route forwards
          the key to GitHub or your selected AI provider. Keys are not intentionally logged or stored server-side.
        </p>
        <p>
          Default key storage is session-only. Remember keys is opt-in and stores keys in this browser&apos;s localStorage.
          Browser extensions, malware, someone with your unlocked device, or any future XSS bug could read browser
          storage, so use scoped, revocable keys with spend limits.
        </p>
        <p>
          Saved chats, saved repos, saved Build Packs, prompt packs, and usage entries are stored in browser
          localStorage by default. ForkFirst does not attach that data to a hosted user account.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Rate limits and abuse controls</h2>
        <p>
          ForkFirst includes per-IP rate limits on key verification, repo research, chat, trending, and idea refinement.
          Local development uses in-memory limits. Hosted deployments should set `UPSTASH_REDIS_REST_URL` and
          `UPSTASH_REDIS_REST_TOKEN` so limits are durable across serverless instances and restarts.
        </p>
        <p>
          Rate limits reduce casual abuse; they do not replace auth, bot protection, WAF rules, provider spend limits, or
          careful monitoring if you run a high-traffic public deployment.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Privacy-safe analytics</h2>
        <p>
          ForkFirst may use Vercel Web Analytics for basic production traffic numbers and Microsoft Clarity for masked
          heatmaps/session diagnostics. Analytics events describe product actions, such as starting a check or
          downloading a handoff, but should not include raw idea text, API keys, README text, or handoff contents.
        </p>
        <p>
          Sensitive app surfaces such as chat transcripts, repo details, README excerpts, handoff files, and key settings
          are marked for Clarity masking. If you run your own deployment, keep Clarity masking strict and do not add
          analytics that captures user-entered prompts or secrets.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Downloaded repo / local run</h2>
        <p>
          If you clone the repo and run ForkFirst locally, the browser still sends keys to the Next.js API route, but
          that route is running on your own machine. Your keys are then forwarded directly from your machine to GitHub
          or your selected AI provider.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Works with your AI builder</h2>
        <p style={{ color: mutedInk, maxWidth: 720 }}>
          ForkFirst exports Markdown handoffs instead of locking you into one coding tool. The same repo-first packet can
          guide the builders you already use.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 20 }}>
          {builderCards.map((builder) => (
            <div key={builder} style={{ border: `1px solid ${line}`, borderRadius: 14, padding: "13px 14px", background: "#151922", color: pageInk, fontWeight: 750 }}>
              {builder}
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>What we do not claim</h2>
        <ul>
          <li>We do not say keys never leave your browser on hosted usage.</li>
          <li>We do not say everything stays on device.</li>
          <li>We do not say local AI stays local unless the user is actually using a trusted local provider.</li>
          <li>We do not say any key-handling system is 100% safe.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Recommended key setup</h2>
        <ul>
          <li>Use a GitHub fine-grained token with the minimum public-repo access needed for search metadata.</li>
          <li>Use provider keys with spending limits, short rotation windows, and revocation ready.</li>
          <li>Do not use custom AI base URLs unless you trust the operator; that server receives your AI key.</li>
          <li>Clear browser data after use on shared machines.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Known dependency advisory</h2>
        <p>
          `npm audit` currently reports a moderate PostCSS advisory through Next.js&apos;s bundled dependency. The suggested
          forced audit fix downgrades Next to an old major version, so ForkFirst tracks this in `docs/security-advisories.md`
          and should upgrade Next when a stable patched path is available.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Remaining risks</h2>
        <p>
          A hosted BYOK app can reduce risk, but it cannot eliminate it. Risks include malicious browser extensions,
          compromised devices, provider-side logging, network or device malware, XSS bugs, supply-chain bugs, phishing
          lookalikes, and users pasting overly powerful API keys. Treat this page as a living security contract.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>Report a vulnerability</h2>
        <p>
          Please do not open a public issue with secrets or exploit details. Use a private GitHub Security Advisory so
          the maintainer can fix and disclose responsibly.
        </p>
        <p>
          <a href={securityAdvisoryUrl} target="_blank" rel="noreferrer" style={{ color: accent, fontWeight: 850 }}>
            Open a private security advisory
          </a>
        </p>
      </section>
      </main>
    </div>
  );
}
