"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, Home, Save, Trash2 } from "lucide-react";
import type { KeyVerificationState } from "@/lib/keys/key-status";
import { keyStatusLabel } from "@/lib/keys/key-status";
import { classifyBaseUrl, KNOWN_PROVIDER_HOSTS } from "@/lib/keys/base-url-policy";

export type UserKeys = {
  githubToken: string;
  aiProvider: "openai" | "groq" | "deepseek" | "custom";
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl: string;
  aiBaseUrlAcknowledged?: boolean;
};

type KeySettingsProps = {
  keys: UserKeys;
  onChange: (keys: UserKeys) => void;
  verification: KeyVerificationState;
  verifying: boolean;
  onVerify: (keys: UserKeys) => void;
  rememberKeys: boolean;
  onRememberKeysChange: (remember: boolean) => void;
  onClearAllData: () => void;
  onShowWelcome: () => void;
};

export function KeySettings({
  keys,
  onChange,
  verification,
  verifying,
  onVerify,
  rememberKeys,
  onRememberKeysChange,
  onClearAllData,
  onShowWelcome
}: KeySettingsProps) {
  const [draftKeys, setDraftKeys] = useState(keys);
  const providerDefaults = {
    openai: { label: "OpenAI", model: "gpt-4.1-nano", baseUrl: "" },
    groq: { label: "Groq", model: "llama-3.1-8b-instant", baseUrl: "https://api.groq.com/openai/v1" },
    deepseek: { label: "DeepSeek", model: "deepseek-v4-flash", baseUrl: "https://api.deepseek.com" },
    custom: { label: "OpenAI-compatible", model: keys.aiModel || "model-name", baseUrl: keys.aiBaseUrl }
  } as const;
  const providerKeyLinks = {
    openai: { label: "Get OpenAI key", href: "https://platform.openai.com/api-keys" },
    groq: { label: "Get Groq key", href: "https://console.groq.com/keys" },
    deepseek: { label: "Get DeepSeek key", href: "https://platform.deepseek.com/api_keys" },
    custom: { label: "OpenAI-compatible docs", href: "https://platform.openai.com/docs/api-reference" }
  } as const;

  useEffect(() => {
    setDraftKeys(keys);
  }, [keys]);

  function updateProvider(provider: UserKeys["aiProvider"]) {
    const defaults = providerDefaults[provider];
    setDraftKeys({
      ...draftKeys,
      aiProvider: provider,
      aiModel: defaults.model,
      aiBaseUrl: defaults.baseUrl,
      aiBaseUrlAcknowledged: provider !== "custom" ? false : draftKeys.aiBaseUrlAcknowledged
    });
  }

  const customUrlClassification =
    draftKeys.aiProvider === "custom" ? classifyBaseUrl(draftKeys.aiBaseUrl) : null;
  const customUrlIsUntrusted = customUrlClassification?.ok === true && !customUrlClassification.trusted;
  const customUrlIsInvalid = customUrlClassification && customUrlClassification.ok === false;
  const needsAcknowledgement = customUrlIsUntrusted && !draftKeys.aiBaseUrlAcknowledged;
  const canSave = !needsAcknowledgement && !customUrlIsInvalid;

  return (
    <details className="key-settings" open>
      <summary>
        <KeyRound size={15} />
        Keys and providers
        <span>{verification.github === "verified" || verification.ai === "verified" ? "verified" : keys.githubToken || keys.aiApiKey ? "configured" : "optional"}</span>
      </summary>
      <div className="key-verify-strip">
        <span className={verification.github}>{`GitHub ${keyStatusLabel(verification.github)}`}</span>
        <span className={verification.ai}>{`${providerDefaults[keys.aiProvider].label} ${keyStatusLabel(verification.ai)}`}</span>
      </div>
      <div className="key-stack">
        <section className="key-panel security-disclosure" aria-label="How keys work">
          <div className="key-panel-heading">
            <strong>How keys work</strong>
            <span>ForkFirst defaults to Groq as the BYOK provider. Paste your own provider key when you want AI-backed results, or use demo mode without adding keys.</span>
          </div>
          <ul>
            <li>On the hosted link, keys are sent to this app&apos;s API route only for the request you trigger, then forwarded to GitHub or your selected AI provider.</li>
            <li>On a local clone, the same API route runs on your own machine.</li>
            <li>Keys are session-only by default. Turning on remember keys stores them in this browser&apos;s localStorage.</li>
            <li>Use scoped, revocable keys with spend limits. Custom AI base URLs receive your AI key, so only use hosts you trust.</li>
          </ul>
          <a className="key-security-link" href="/security">
            Read the full security model
          </a>
        </section>
        <section className="key-panel">
          <div className="key-panel-heading">
            <strong>GitHub access</strong>
            <span>Optional. Raises GitHub search limits and improves repo metadata. Read-only public-repo scope is enough.</span>
          </div>
          <div className="key-grid single">
            <label>
              <span>GitHub token</span>
              <input
                value={draftKeys.githubToken}
                onChange={(event) => setDraftKeys({ ...draftKeys, githubToken: event.target.value })}
                placeholder="github_pat_..."
                type="password"
                autoComplete="off"
              />
            </label>
            <div className="key-links">
              <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noreferrer">
                Get GitHub token
              </a>
            </div>
          </div>
        </section>

        <section className="key-panel">
          <div className="key-panel-heading">
            <strong>AI provider</strong>
            <span>Optional. Powers stronger summaries and verdicts. Demo mode works without a key. The key is sent only with the request you trigger and is never stored server-side.</span>
          </div>
          <div className="key-grid">
            <label>
              <span>Provider</span>
              <select value={draftKeys.aiProvider} onChange={(event) => updateProvider(event.target.value as UserKeys["aiProvider"])}>
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="deepseek">DeepSeek</option>
                <option value="custom">OpenAI-compatible</option>
              </select>
            </label>
            <label>
              <span>{providerDefaults[draftKeys.aiProvider].label} API key</span>
              <input
                value={draftKeys.aiApiKey}
                onChange={(event) => setDraftKeys({ ...draftKeys, aiApiKey: event.target.value })}
                placeholder={draftKeys.aiProvider === "groq" ? "gsk_..." : draftKeys.aiProvider === "deepseek" ? "sk_..." : "sk-proj_..."}
                type="password"
                autoComplete="off"
              />
            </label>
            <details className="advanced-keys">
              <summary>Advanced model settings</summary>
              <label>
                <span>Model</span>
                <input
                  value={draftKeys.aiModel}
                  onChange={(event) => setDraftKeys({ ...draftKeys, aiModel: event.target.value })}
                  placeholder={providerDefaults[draftKeys.aiProvider].model}
                  autoComplete="off"
                />
              </label>
              {draftKeys.aiProvider === "custom" ? (
                <>
                  <label>
                    <span>Base URL</span>
                    <input
                      value={draftKeys.aiBaseUrl}
                      onChange={(event) =>
                        setDraftKeys({ ...draftKeys, aiBaseUrl: event.target.value, aiBaseUrlAcknowledged: false })
                      }
                      placeholder="https://api.example.com/v1"
                      autoComplete="off"
                    />
                  </label>
                  {customUrlIsInvalid ? (
                    <div className="custom-url-warning invalid">
                      <AlertTriangle size={14} />
                      <div>
                        <strong>Invalid base URL</strong>
                        <span>Must be a full http(s) URL. Example: https://api.example.com/v1</span>
                      </div>
                    </div>
                  ) : null}
                  {customUrlIsUntrusted ? (
                    <div className="custom-url-warning">
                      <AlertTriangle size={14} />
                      <div>
                        <strong>Untrusted host: {customUrlClassification!.host}</strong>
                        <span>
                          {customUrlClassification!.privateHost
                            ? "Private and localhost URLs are blocked by default on hosted deployments because they target the server network, not your browser."
                            : "Your API key will be sent to this server. Only use providers you trust."}{" "}
                          Known hosts: {KNOWN_PROVIDER_HOSTS.join(", ")}.
                        </span>
                        <label className="custom-url-ack">
                          <input
                            type="checkbox"
                            checked={Boolean(draftKeys.aiBaseUrlAcknowledged)}
                            onChange={(event) =>
                              setDraftKeys({ ...draftKeys, aiBaseUrlAcknowledged: event.target.checked })
                            }
                          />
                          <span>I trust this URL and accept that my API key will be sent to it.</span>
                        </label>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </details>
            <div className="key-links">
              <a href={providerKeyLinks[draftKeys.aiProvider].href} target="_blank" rel="noreferrer">
                {providerKeyLinks[draftKeys.aiProvider].label}
              </a>
            </div>
          </div>
        </section>

        <button
          className="save-keys-button"
          type="button"
          onClick={() => onChange(draftKeys)}
          disabled={!canSave}
        >
          <Save size={14} />
          Save settings
        </button>
        <button
          className="verify-keys-button"
          type="button"
          onClick={() => onVerify(draftKeys)}
          disabled={verifying || !canSave}
        >
          <CheckCircle2 size={14} />
          {verifying ? "Checking..." : "Save and verify"}
        </button>
        <p className="key-verify-message">{verification.message}</p>

        <section className="key-panel privacy-panel">
          <div className="key-panel-heading">
            <strong>Storage & privacy</strong>
            <span>Keys are kept for this tab by default. They are sent only when you run verification, repo research, or chat.</span>
          </div>
          <label className="key-toggle">
            <input
              type="checkbox"
              checked={rememberKeys}
              onChange={(event) => onRememberKeysChange(event.target.checked)}
            />
            <span>
              <strong>Remember keys between sessions</strong>
              <em>{rememberKeys ? "Saved to this browser in localStorage." : "Session-only. Cleared when you close the tab."}</em>
            </span>
          </label>
          <a className="key-security-link" href="/security">
            Read the hosted vs local security model
          </a>
          <button
            className="show-welcome-button"
            type="button"
            onClick={onShowWelcome}
          >
            <Home size={14} />
            Show welcome page
          </button>
          <button
            className="clear-data-button"
            type="button"
            onClick={() => {
              if (window.confirm("Clear all saved keys, chats, folders, and saved repos from this browser? This cannot be undone.")) {
                onClearAllData();
              }
            }}
          >
            <Trash2 size={14} />
            Clear all saved data
          </button>
        </section>
      </div>
    </details>
  );
}
