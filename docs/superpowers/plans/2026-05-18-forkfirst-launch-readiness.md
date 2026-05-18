# ForkFirst Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ForkFirst feel launch-clean as a public repo, live demo, and lead-generating AI Builder Handoff tool.

**Architecture:** Keep the app local-first and BYOK-safe while tightening the public-facing surface: README, CI, Vercel config, product copy, launch proof, and trust copy. Avoid new feature scope until the core flow is excellent: idea to ranked repos to foundation decision to builder handoff.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, GitHub Actions, Vercel.

---

### Task 1: Public Repo Identity

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `PRIVACY.md`
- Modify: `SECURITY.md`
- Modify: `RELEASE_CHECKLIST.md`
- Modify: `public/brand/*`
- Modify: `src/components/app-footer.tsx`
- Modify: `src/app/security/page.tsx`

- [ ] **Step 1: Replace stale repository references**

Run:

```bash
rg -n "stale-repo-owner|placeholder-domain" package.json package-lock.json README.md CONTRIBUTING.md PRIVACY.md SECURITY.md RELEASE_CHECKLIST.md public src docs
```

Expected: no production-facing stale identity remains, except test URLs that intentionally use fake hosts.

- [ ] **Step 2: Normalize metadata**

Update `package.json` so `homepage`, `repository.url`, and `bugs.url` point to `https://github.com/ZenovaZeni/forkfirst`, then add launch-facing keywords, author, and Node engine metadata.

- [ ] **Step 3: Update lockfile**

Run:

```bash
npm install --package-lock-only
```

Expected: `package-lock.json` root metadata matches `package.json`.

### Task 2: Launch Proof and CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `docs/assets/README.md`
- Create: `vercel.json`

- [ ] **Step 1: Add CI**

Create `.github/workflows/ci.yml` with Node 22 and these commands:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

- [ ] **Step 2: Add launch proof to README**

Add CI, deploy, license, Next.js, and BYOK/demo badges. Add screenshots from `public/screenshots/`, the live URL, setup notes, and service positioning.

- [ ] **Step 3: Add reproducible Vercel config**

Create `vercel.json` with `framework`, `installCommand`, and `buildCommand` so future deploys do not drift from Next.js zero-config expectations.

### Task 3: Product Positioning

**Files:**
- Modify: `src/components/forkfirst-redesign.tsx`
- Modify: `src/app/redesign.css`

- [ ] **Step 1: Tighten landing copy**

Focus the first viewport on the promise: find the best open-source starting point before an AI builder starts coding.

- [ ] **Step 2: Add service bridge**

Add a concise AI Builder Handoff Audit section with `$297`, `$497`, and `$997+` options so ForkFirst supports Zenova lead generation without becoming a rushed SaaS.

- [ ] **Step 3: Keep visual language flat**

Use flat accent colors and existing theme tokens. Do not add new gradients.

### Task 4: Trust Copy

**Files:**
- Modify: `src/components/sidebars.tsx`
- Modify: `src/components/key-settings.tsx`
- Modify: `src/lib/keys/key-status.ts`
- Modify: `src/app/security/page.tsx`
- Modify: `PRIVACY.md`
- Modify: `SECURITY.md`

- [ ] **Step 1: Clarify key handling**

State that keys are kept in session storage by default, sent only for user-triggered requests, and persisted only when Remember keys is enabled.

- [ ] **Step 2: Clarify local storage**

Document that saved chats, repos, Build Packs, prompt packs, and usage entries are stored in browser localStorage by default.

- [ ] **Step 3: Clarify SQLite behavior**

Document that server-side SQLite persistence is only enabled when `FORKFIRST_ENABLE_SERVER_DB=true`, including local or self-hosted deployments.

### Task 5: Verification and Release

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run full checks**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 2: Browser smoke test**

Start the dev server, open the local app, verify the landing CTAs navigate, and confirm the first screen has a working composer.

- [ ] **Step 3: Deploy production**

Run:

```bash
npx vercel deploy --prod --yes
```

Expected: Vercel returns a ready production URL and `https://forkfirst.vercel.app` returns `200 OK`.

- [ ] **Step 4: Commit and push**

Commit with:

```bash
git add .
git commit -m "Polish ForkFirst launch readiness"
git push origin main
```

Expected: GitHub Actions starts on `main` and the public repo reflects the launch-ready updates.
