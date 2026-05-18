"use client";

import { GitFork, Send } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

type IdeaInputProps = {
  prompt: string;
  loading: boolean;
  submitLabel?: string;
  compact?: boolean;
  isFollowUp?: boolean;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
};

export function IdeaInput({ prompt, loading, submitLabel = "Check Idea", compact = false, isFollowUp = false, onPromptChange, onSubmit }: IdeaInputProps) {
  const [githubUrl, setGithubUrl] = useState("");
  const minLength = isFollowUp ? 2 : 8;
  const canSubmit = !loading && prompt.trim().length >= minLength;
  const canUseRepo = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(githubUrl.trim());

  function handleUseRepo() {
    if (!canUseRepo) return;
    const repoPath = githubUrl.trim().replace(/^https?:\/\/github\.com\//, "").split(/[?#/]/).slice(0, 2).join("/");
    onPromptChange(`I want to use ${repoPath} as a repo foundation. What I want to build: `);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (canSubmit) onSubmit();
    }
  }

  return (
    <section className={`idea-hero ws-empty ${compact || isFollowUp ? "compact-idea-hero" : ""}`}>
      {compact ? null : (
        <>
          <h1 className="greeting">
            What are you <span className="accent-word">about to build?</span>
          </h1>
          <p className="hero-copy sub">Say it like you&apos;d say it out loud. We&apos;ll find what already exists, before your AI burns through your tokens trying to invent it.</p>
        </>
      )}
      <div className="ask-box composer">
        <textarea
          aria-label="Idea prompt"
          suppressHydrationWarning
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={compact ? "Ask a follow-up, compare repos, or search again..." : "What are you about to build? Say it like you'd say it to a friend."}
          rows={compact ? 2 : 4}
        />
        <div className="ask-actions composer-row">
          <div className="chips composer-chips">
            <span className="chip is-active">Public GitHub</span>
            <span className="chip">Rank by fit</span>
            <span className="chip">Save results</span>
          </div>
          <button className="composer-send" disabled={!canSubmit} onClick={onSubmit} title="Ctrl+Enter to send">
            {loading ? "Thinking..." : submitLabel}
            <Send size={14} />
          </button>
        </div>
      </div>
      {compact ? null : (
        <div className="paste-shortcut">
          <span className="pico">
            <GitFork size={13} /> Already know the repo?
          </span>
          <input
            aria-label="GitHub repo URL"
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            placeholder="paste a github.com/owner/repo URL - skip the search"
          />
          <button className="go-btn" type="button" disabled={!canUseRepo} onClick={handleUseRepo}>
            Use repo
          </button>
        </div>
      )}
      {compact ? null : <div className="prompt-examples" aria-label="Example prompts">
        <button type="button" onClick={() => onPromptChange("Find repos like Cursor, but open source and useful as a starting point")}>
          Cursor alternatives
        </button>
        <button type="button" onClick={() => onPromptChange("Find open-source AI lead generation tools for small business owners")}>
          AI lead-gen tools
        </button>
        <button type="button" onClick={() => onPromptChange("What are some cool open-source AI repos for builders?")}>
          AI repos for builders
        </button>
        <button type="button" onClick={() => onPromptChange("What open-source tools are useful for business owners?")}>
          Tools for business owners
        </button>
      </div>}
    </section>
  );
}
