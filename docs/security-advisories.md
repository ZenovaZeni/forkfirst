# Security Advisories

## Current Status

`npm audit --omit=dev` is expected to pass before public launch.

ForkFirst keeps a project-level `postcss` override so npm installs a patched PostCSS line instead of using a vulnerable nested version. Do not run `npm audit fix --force` without reviewing the full dependency diff; forced audit fixes can downgrade framework packages or otherwise change the runtime in unsafe ways.

## Release Checklist

- Run `npm audit --omit=dev`.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Review Next.js, React, Vercel, GitHub, and provider advisories before major launches.
- Confirm screenshots, docs, and examples do not contain real tokens, API keys, or private repo data.
- Report security questions or concerns via the project's official support channel or GitHub private security advisory flow.

## BYOK Reminder

ForkFirst is a browser-hosted BYOK app. A clean dependency audit does not remove browser risks such as malicious extensions, compromised devices, XSS, overly powerful provider keys, or hosted-route trust while requests are in flight.
