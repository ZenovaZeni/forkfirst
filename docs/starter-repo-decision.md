# Starter Repo Decision

Date: 2026-05-12

## Decision

Build ForkFirst on top of Vercel's open-source Chatbot template, then reshape it into a local/private GitHub idea-checking product.

Starter:

- Repository: `vercel/chatbot`
- GitHub URL: https://github.com/vercel/ai-chatbot
- Product/docs URL: https://chatbot.ai-sdk.dev

## Why This Starter

The project already matches the shell we need: a polished Next.js AI chat application.

Useful built-in pieces:

- Next.js App Router.
- Vercel AI SDK.
- shadcn/ui and Tailwind CSS.
- Chat-oriented UI structure.
- AI provider abstraction patterns.
- Persistence and migration patterns.
- Playwright/test tooling patterns.

This saves time on app plumbing and lets us spend effort on the unique product: GitHub idea validation, repository scoring, verdicts, saved research cases, and Discovery Radar.

## What Not To Copy Blindly

Do not preserve template complexity just because it exists.

V1 should avoid:

- Public multi-user product assumptions.
- Billing.
- Heavy auth flows.
- Remote-only persistence.
- File/artifact features unrelated to GitHub idea research.
- Generic chatbot branding.

## Adaptation Strategy

1. Fork or copy the starter.
2. Verify it runs locally before changing behavior.
3. Remove or disable features outside V1 scope.
4. Replace the default UI with the ForkFirst Chat First, Radar Second layout.
5. Add a local SQLite persistence layer.
6. Add the GitHub provider and deterministic scoring engine.
7. Add the AI analyst provider behind an interface.
8. Add saved research cases, favorites, notes, and Discovery Radar.

## Fallback If Starter Is Too Heavy

If the starter creates more friction than it saves, fall back to a fresh Next.js app with:

- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Vercel AI SDK.
- SQLite.
- Playwright.

The fallback should reuse the same architecture and product docs.

