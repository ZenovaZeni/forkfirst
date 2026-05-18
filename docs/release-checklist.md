# Release Checklist

Use this before publishing ForkFirst as a free public repository or tagging a release.

## Product Smoke Test

- Start from a clean browser profile or clear ForkFirst site data.
- Run the default prompt without any keys.
- Confirm the app returns a readable demo-mode verdict, repo leads, and helpful warnings.
- Save at least two repos into different boards.
- Export the Markdown report and confirm it includes the executive summary, recommended next moves, top repo details, warnings, opportunity gaps, saved boards, and reproduce steps.
- Generate a Build Pack for `Codex` and confirm the modal contains copyable project context.
- Ask a follow-up such as `Compare the top 3 and tell me which one you would start with`.

## BYOK Smoke Test

- Paste a read-only GitHub token and verify it.
- Paste one AI provider key and verify it.
- Run one search with keys enabled.
- Confirm keys remain in browser storage and are not written to `.forkfirst/forkfirst.sqlite`.
- Clear local browser site data when the demo is finished.

## Repo Hygiene

- Confirm `.env.local`, `.forkfirst/`, `.next/`, and `node_modules/` are not committed.
- Confirm `.env.example` contains placeholders only.
- Confirm screenshots do not expose private tokens, local secrets, or private repos.
- Review `PRIVACY.md`, `SECURITY.md`, `CONTRIBUTING.md`, and `ROADMAP.md` for stale claims.
- Check README links and screenshot paths.
- Confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured for hosted production rate limiting.
- Confirm `FORKFIRST_ALLOW_SERVER_KEYS=false`, `FORKFIRST_ENABLE_SERVER_DB=false`, and `FORKFIRST_ALLOW_PRIVATE_BASE_URLS=false` on the public hosted deployment.
- Re-run `npm audit --audit-level=moderate` and compare any known unresolved items with `docs/security-advisories.md`.
- Open the three public sample handoffs and confirm they do not imply license clearance.

## Commands

Run these before release:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

If any command fails, note the failure in the release notes and fix it before tagging a public release.
