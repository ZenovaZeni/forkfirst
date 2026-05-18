# Security Advisories

## Current audit note: Next.js bundled PostCSS

`npm audit --audit-level=moderate` currently reports:

- Package: `postcss <8.5.10`
- Path: bundled under `next`
- Advisory: XSS via unescaped `</style>` in CSS stringify output
- Severity: moderate

ForkFirst pins the project-level `postcss` package to a patched line, but the installed Next.js release still bundles its own `postcss@8.4.31`. The npm auto-fix suggests a breaking downgrade to `next@9.3.3`, which is not acceptable.

Status:

- Do not run `npm audit fix --force` for this advisory.
- Recheck when a stable Next release ships with patched bundled PostCSS.
- Re-test `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before accepting a Next upgrade.

Mitigations already in the app:

- Strict CSP blocks broad third-party script execution.
- User-provided text is rendered as React text, not raw HTML.
- Repo README content is treated as untrusted prompt data before LLM use.
- API responses use `Cache-Control: no-store`.

This note should be reviewed before every public release.
