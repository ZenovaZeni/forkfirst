# Security Policy

ForkFirst is designed as a local-first builder tool that can also run as a public BYOK site. Treat hosted deployments as sensitive infrastructure: users may paste provider keys, and your API routes see those keys in memory while forwarding user-triggered requests.

## Data Flow

- Keys pasted in the app are session-only by default. Persistent browser `localStorage` is opt-in with "Remember keys".
- Keys are sent to the running Next.js API only when you verify a key, run repo research, use chat, or request live trending with a GitHub token.
- The API forwards your request to GitHub or the chosen AI provider for that single call. Keys are not persisted server-side.
- Optional server defaults in `.env.local` are loaded only by the server process.
- Prompts, verdicts, and repo results are persisted locally in `.forkfirst/forkfirst.sqlite` only when server-side DB mode is explicitly enabled or when running local/self-host flows that use the local database.
- Older local installs may have `.open-repo/open-repo.sqlite`; ForkFirst migrates that data into `.forkfirst/forkfirst.sqlite` without deleting the legacy folder.
- `.env.local`, `.forkfirst/`, `.open-repo/`, `.next/`, and `node_modules/` must **never be committed**.

## What ForkFirst Does Not Do

- It does not store keys server-side.
- It does not transmit keys to any third party other than the provider you chose.
- It does not write keys into the local SQLite database.
- It does not log request bodies in production builds.
- It does not guarantee that any surfaced repo is safe to copy, fork, or redistribute. License checks are advisory only.

## Public Hosting Notes

ForkFirst accepts custom OpenAI-compatible base URLs. Private and localhost base URLs are blocked by default because, on hosted deployments, `localhost` means the server network, not the user's computer.

For a public hosted version:

- Keep `FORKFIRST_ALLOW_SERVER_KEYS=false`.
- Keep `FORKFIRST_ENABLE_SERVER_DB=false` unless you add auth, tenant isolation, deletion/export controls, and a privacy policy.
- Configure durable rate limiting with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Keep request logging controls that never store API keys, request bodies, provider responses, or Authorization headers.
- Use provider spend limits and scoped/revocable keys for your own testing.
- Add WAF/bot protection if the hosted site gets meaningful traffic.

Without Upstash Redis REST env vars, ForkFirst falls back to in-memory rate limits. That is acceptable for local development, but not strong enough for production serverless traffic because each instance has its own memory and limits reset on restart.

## Known Dependency Advisory

`npm audit --audit-level=moderate` currently reports a moderate PostCSS advisory through Next.js's bundled dependency. The forced npm audit fix downgrades Next to an old major version and should not be used. Track this in `docs/security-advisories.md` and upgrade Next when a stable patched path is available.

## Reporting Vulnerabilities

If you find a vulnerability, **do not** open a public issue.

- Open a private security advisory in this GitHub repo, **or**
- Contact the maintainer privately via the email listed in `package.json`.

Do not post working secrets, tokens, or exploit details in public issues or pull requests.

## Disclaimer

ForkFirst surfaces and ranks public GitHub repositories. License classification is derived from GitHub metadata and is best-effort. Always inspect the LICENSE file, attribution notices, dependency licenses, and asset/model/data licenses of any repo before reusing code in your own project.
