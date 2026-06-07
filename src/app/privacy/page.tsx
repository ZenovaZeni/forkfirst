import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ForkFirstLogo } from "@/components/forkfirst-logo";

export const metadata: Metadata = {
  title: "ForkFirst Privacy",
  description: "How ForkFirst handles prompts, keys, local storage, analytics, and privacy-sensitive app data."
};

const sectionStyle = {
  borderTop: "1px solid var(--line)",
  paddingTop: 34,
  marginTop: 42
};
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

const privacyCards = [
  {
    title: "BYOK by design",
    body: "ForkFirst does not require accounts. Keys are provided by the user and used only for actions the user triggers."
  },
  {
    title: "Local-first drafts",
    body: "Saved chats, repos, handoffs, prompt packs, and usage entries live in the browser by default."
  },
  {
    title: "No prompt selling",
    body: "ForkFirst is not built around selling, renting, or training on your app ideas or handoff text."
  },
  {
    title: "Masked analytics",
    body: "Product analytics should track actions, not raw idea text, API keys, README text, or handoff contents."
  }
];

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

export default function PrivacyPage() {
  return (
    <div className="legal-page legal-page--privacy">
      <main className="legal-page__shell">
        <Link className="legal-page__brand" href="/">
          <ForkFirstWordmark />
        </Link>
        <p className="legal-page__eyebrow">Privacy and local-first storage</p>
        <h1 className="legal-page__title">Your ideas stay yours.</h1>
        <p className="legal-page__lede">
          ForkFirst helps you research public GitHub repos and generate AI-builder handoffs <Highlight>without creating an account</Highlight>.
          The app is designed to keep user-entered ideas, saved repos, and handoff drafts local to the browser unless a
          <Highlight>specific request needs to be sent to GitHub or your selected AI provider</Highlight>.
        </p>

        <div className="legal-page__trust-grid">
          {privacyCards.map((card) => (
            <article className="legal-page__trust-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </article>
          ))}
        </div>

        <section className="legal-page__section" style={sectionStyle}>
          <h2>What stays in your browser</h2>
          <p>
            Saved chats, saved repos, saved handoffs, prompt pack choices, accent/theme settings, and usage counters are
            stored in browser storage by default. <Highlight>ForkFirst does not attach that information to a hosted user account.</Highlight>
          </p>
          <p>
            If you use a shared machine, <Highlight>clear browser data after use</Highlight>. Browser storage can be read by someone with access
            to the unlocked device, malicious extensions, malware, or a future browser-side security bug.
          </p>
        </section>

        <section className="legal-page__section" style={sectionStyle}>
          <h2>What gets sent when you use the hosted app</h2>
          <p>
            When you trigger repo search, key verification, chat, idea refinement, or trending requests, <Highlight>ForkFirst sends
            the minimum needed request to its API route. That route may forward your GitHub token to GitHub or your AI key
            to the selected AI provider for that action.</Highlight>
          </p>
          <p>
            <Highlight>ForkFirst should not intentionally log raw API keys, raw prompts, README text, or full handoff contents.</Highlight> The
            practical privacy model is transparent BYOK routing, not a claim that hosted usage is fully local.
          </p>
        </section>

        <section className="legal-page__section" style={sectionStyle}>
          <h2>Analytics</h2>
          <p>
            ForkFirst may use Vercel Web Analytics and strictly masked Microsoft Clarity to understand traffic, device
            layout problems, and where users get stuck. <Highlight>Analytics should describe product actions</Highlight> like starting a check,
            opening repo details, or downloading a handoff.
          </p>
          <p>
            <Highlight>Analytics should not include raw idea text, API keys, full chat transcripts, README excerpts, or handoff
            files.</Highlight> Sensitive app surfaces are marked for masking.
          </p>
        </section>

        <section className="legal-page__section" style={sectionStyle}>
          <h2>Local runs</h2>
          <p>
            If you clone ForkFirst and run it locally, the same browser-to-API-route flow happens on your own machine.
            <Highlight>Your keys are then forwarded from your machine to GitHub or your selected AI provider.</Highlight>
          </p>
        </section>

        <section className="legal-page__section" style={sectionStyle}>
          <h2>Security model</h2>
          <p>
            Privacy and security overlap, but they are not the same page. For BYOK risks, key storage, rate limits, and
            vulnerability reporting, <Highlight>read the security model</Highlight>.
          </p>
          <p>
            <Link href="/security">Read the ForkFirst security model</Link>
          </p>
        </section>

        <section className="legal-page__section" style={sectionStyle}>
          <h2>Contact</h2>
          {supportEmail ? (
            <p>
              For privacy, support, feedback, or security-related questions, email <Highlight>{supportEmail}</Highlight>.
            </p>
          ) : (
            <p>
              For privacy, support, feedback, or security-related questions, use the official project page or repository
              security channel.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
