# Bring Your Own Keys

ForkFirst can run for free in demo mode, but BYOK makes it better.

BYOK means the repo maintainer does not need to ship private production credentials. Each user can decide whether to use the default demo path, paste keys in the browser, or set local/private development defaults in `.env.local`.

## GitHub Token

A GitHub token raises search limits and makes repeated searches more reliable.

Use a fine-grained personal access token with read-only public repository access. Do not grant write permissions.

Get one here:

```text
https://github.com/settings/personal-access-tokens
```

You can paste it in the app or set a local default:

```bash
GITHUB_TOKEN=github_pat_your_token_here
```

## AI Provider Keys

ForkFirst defaults to Groq in the app because Groq offers a free path for users to try with their own account. ForkFirst also supports:

- Groq
- OpenAI
- DeepSeek
- Custom OpenAI-compatible providers

Provider key pages:

```text
OpenAI:   https://platform.openai.com/api-keys
Groq:     https://console.groq.com/keys
DeepSeek: https://platform.deepseek.com/api_keys
```

The default Groq model is `llama-3.1-8b-instant`. OpenAI defaults to `gpt-4.1-nano`. DeepSeek defaults to `deepseek-v4-flash`.

## Where Keys Are Stored

Keys pasted into the app are session-only by default. If the user turns on "Remember keys", ForkFirst stores them in browser localStorage. Keys are sent to the running ForkFirst server only when verifying keys or running requests the user triggers.

Keys are not stored in `.forkfirst/forkfirst.sqlite`.

To clear pasted keys, use the app panel to replace them with empty values or clear browser site data for the local ForkFirst origin.

## Public Repo Owner Safety

If you publish ForkFirst as a free public repo, do not include your own production keys. Let users bring their own keys.

Do not enable maintainer-owned AI provider keys on a public no-login deployment unless you have auth, quotas, rate limits, abuse controls, and clear disclosure that visitors are using a hosted allowance.

Before launch, check:

- `.env.local` is not committed.
- `.env.example` contains only placeholders.
- `FORKFIRST_ALLOW_SERVER_KEYS=false` on public hosted deployments.
- Logs do not print request bodies.
- README and screenshots do not reveal real tokens.

## Support and Contact

ForkFirst is free and open-source. If it saves time or tokens, users can support the project by sharing feedback, issues, and improvements.

For support, feedback, or security-related questions, use the official project page or repository security channel.
