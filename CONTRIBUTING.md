# Contributing to ForkFirst

Thanks for helping make ForkFirst better. This project is small, focused, and BYOK-first - contributions that protect those properties are especially welcome.

## Local Setup

Requires Node.js 20 or newer.

```bash
git clone https://github.com/officialzenovaai/forkfirst.git
cd forkfirst
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open `http://127.0.0.1:3000`. ForkFirst works in demo mode without any keys; paste your own keys in the **Keys and providers** panel for stronger summaries and higher rate limits.

## Before You Open a PR

Run all four:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

If a check fails, fix the root cause rather than skipping the check.

## What Makes a Good PR

- **One concern per PR.** Easier to review, easier to revert.
- **Tests for behavior changes.** Especially around prompt planning, scoring, and Build Pack generation.
- **Plain-English copy.** Repo descriptions and Build Pack sections should read like a human helper, not a marketing page.
- **BYOK-safe.** No new hard dependency on a paid hosted key, no logging of request bodies, no writing user keys to disk.
- **Advisory license language only.** Never claim a repo is "safe to fork" or "license cleared".

## Good First Issues

- Add fixture tests for repo classification edge cases.
- Improve prompt planning for a specific builder niche.
- Add screenshots or a short demo GIF to the README.
- Improve mobile result density.
- Add a new OpenAI-compatible provider preset.
- Add a new Build Pack profile (e.g., game tool, dashboard, scraping tool).

## Product Principles

- Explain repos in plain English.
- Prefer useful builder guidance over raw GitHub popularity.
- Keep keys local and user-owned.
- Make the free version genuinely useful.
- Refuse to overpromise license safety.

## Code of Conduct

Be kind, be specific, be helpful. Disagree on the work, not the person.
