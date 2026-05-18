# Privacy

ForkFirst is designed as a local-first research tool.

## What Stays Local

- User-entered keys are session-only by default. Persistent `localStorage` is opt-in with "Remember keys".
- Saved chats, saved repos, saved Build Packs, prompt packs, usage entries, and the optional "Remember keys" setting are stored in browser `localStorage`.
- Idea checks are persisted to `.forkfirst/forkfirst.sqlite` only when `FORKFIRST_ENABLE_SERVER_DB=true`, including local or self-hosted runs. The default app experience keeps research state in the browser.

## What Is Sent To APIs

When you run an idea check, ForkFirst may send:

- the idea prompt,
- GitHub search queries,
- a GitHub token if you provided one,
- an AI provider key if you provided one,
- repo metadata and README excerpts for analysis.

Keys are sent only to the running ForkFirst server for verification, repo research, chat, or trending requests the user triggers. They are not written to SQLite by the app.

## Demo Mode

Without AI keys, ForkFirst still searches GitHub and uses deterministic local scoring. Summaries and verdicts are less flexible, but no AI provider key is required.

## Deleting Local Data

To clear browser data, use your browser's site data controls for the ForkFirst URL.

To clear local research history, delete:

```bash
.forkfirst/
```

Older local installs may also have `.open-repo/`; ForkFirst migrates that SQLite file forward if it exists, but does not delete the legacy folder automatically.

Never commit `.env.local`, `.forkfirst/`, `.next/`, or `node_modules/`.

## Public Hosting

If you host ForkFirst for other users, configure durable rate limiting with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, keep server-side key fallback disabled, keep server-side DB persistence disabled unless you add auth/tenant controls, and do not log request bodies because users may send their own keys.

Report security issues privately at:

https://github.com/ZenovaZeni/forkfirst/security/advisories/new
