"use client";

import { useRef, useState, type PointerEvent } from "react";
import {
  applyPromptPackRecommendations,
  type PromptPackRecommendation,
} from "@/lib/prompt-packs/recommendations";
import {
  resolvePacks,
  enabledPackMarkdown,
  estimateTokens,
  addCustomPack,
  updateCustomPack,
  deleteCustomPack,
  togglePack,
  type PromptPackState,
  type ResolvedPack
} from "@/lib/prompt-packs/storage";

type PromptPacksPanelProps = {
  state: PromptPackState;
  onChange: (next: PromptPackState) => void;
  recommendations?: PromptPackRecommendation[];
};

function useSwipeDownDismiss(onDismiss: () => void, threshold = 72) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;
      startRef.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (dy > threshold && Math.abs(dx) < 80) onDismiss();
    },
    onPointerCancel: () => {
      startRef.current = null;
    }
  };
}

type EditForm = {
  name: string;
  blurb: string;
  content: string;
};

const EMPTY_FORM: EditForm = { name: "", blurb: "", content: "" };

export function PromptPacksPanel({ state, onChange, recommendations = [] }: PromptPacksPanelProps) {
  const [detailsPackId, setDetailsPackId] = useState<string | null>(null);
  const [copiedPackId, setCopiedPackId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_FORM);
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<EditForm>(EMPTY_FORM);
  const [query, setQuery] = useState("");

  const resolved = resolvePacks(state);
  const recommendationById = new Map(recommendations.map((item) => [item.id, item]));
  const recommendedPacks = resolved.filter((pack) => recommendationById.has(pack.id));
  const filteredPacks = resolved.filter((pack) => {
    const recommendation = recommendationById.get(pack.id);
    const searchable = [
      pack.name,
      pack.blurb,
      pack.content,
      pack.source,
      pack.enabled ? "active included enabled" : "available inactive disabled",
      recommendation?.reason ?? "",
      recommendation ? "recommended" : ""
    ].join(" ").toLowerCase();
    return query.trim().toLowerCase().split(/\s+/).every((part) => searchable.includes(part));
  });
  const inactiveRecommendedCount = recommendedPacks.filter((pack) => !pack.enabled).length;
  const enabledCount = resolved.filter((pack) => pack.enabled).length;
  const totalTokens = estimateTokens(enabledPackMarkdown(state));
  const detailsPack = detailsPackId ? resolved.find((pack) => pack.id === detailsPackId) ?? null : null;
  const detailsSwipeDown = useSwipeDownDismiss(() => setDetailsPackId(null));

  function handleToggle(id: string) {
    onChange(togglePack(state, id));
  }

  function handleApplyRecommendations() {
    onChange(applyPromptPackRecommendations(state, recommendations));
  }

  function startEdit(pack: ResolvedPack) {
    setEditingId(pack.id);
    setEditForm({ name: pack.name, blurb: pack.blurb, content: pack.content });
  }

  function commitEdit(id: string) {
    const trimmedName = editForm.name.trim();
    if (!trimmedName) return;
    onChange(updateCustomPack(state, id, {
      name: trimmedName,
      blurb: editForm.blurb.trim(),
      content: editForm.content.trim()
    }));
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this custom pack?")) return;
    onChange(deleteCustomPack(state, id));
  }

  function commitAdd() {
    const trimmedName = newForm.name.trim();
    const trimmedContent = newForm.content.trim();
    if (!trimmedName || !trimmedContent) return;
    onChange(addCustomPack(state, {
      name: trimmedName,
      blurb: newForm.blurb.trim(),
      content: trimmedContent
    }));
    setAddingNew(false);
    setNewForm(EMPTY_FORM);
  }

  function cancelAdd() {
    setAddingNew(false);
    setNewForm(EMPTY_FORM);
  }

  async function copyPackContent(pack: ResolvedPack) {
    try {
      await navigator.clipboard.writeText(pack.content);
      setCopiedPackId(pack.id);
      window.setTimeout(() => {
        setCopiedPackId((current) => current === pack.id ? null : current);
      }, 1600);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = pack.content;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedPackId(pack.id);
      window.setTimeout(() => {
        setCopiedPackId((current) => current === pack.id ? null : current);
      }, 1600);
    }
  }

  return (
    <section className="prompt-packs-panel" aria-label="Prompt Packs">
      <div className="prompt-packs-header">
        <strong className="prompt-packs-title">Prompt Packs</strong>
        <p className="prompt-packs-subtitle">
          Enabled packs are summarized under <strong>Builder Rule Packs</strong> in the builder rules file, while PRD.md stays focused on the product. Preview shows the source Markdown before it is summarized.
        </p>
      </div>

      <div className="prompt-packs-meter">
        <span className="prompt-packs-meter-count">
          {enabledCount} {enabledCount === 1 ? "pack" : "packs"} active
        </span>
        <span className="prompt-packs-meter-sep">&mdash;</span>
        <span className="prompt-packs-meter-tokens">
          ~{totalTokens.toLocaleString()} tokens added per handoff
        </span>
      </div>

      {recommendedPacks.length ? (
        <div className="prompt-packs-recommendations">
          <div>
            <strong>Recommended for this idea</strong>
            <span>
              {recommendedPacks.slice(0, 4).map((pack) => pack.name).join(", ")}
              {recommendedPacks.length > 4 ? ` +${recommendedPacks.length - 4} more` : ""}
            </span>
          </div>
          <button
            type="button"
            className="pack-btn pack-btn-primary"
            onClick={handleApplyRecommendations}
            disabled={inactiveRecommendedCount === 0}
          >
            {inactiveRecommendedCount === 0 ? "Applied" : `Apply ${inactiveRecommendedCount}`}
          </button>
        </div>
      ) : null}

      <div className="smart-search prompt-pack-search">
        <span aria-hidden="true">Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Smart search packs by name, use case, rule text, or recommended..."
          aria-label="Search prompt packs"
        />
        {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
      </div>

      <div className="prompt-packs-list">
        {filteredPacks.map((pack) => {
          const isEditing = editingId === pack.id;
          const packTokens = estimateTokens(pack.content);
          const recommendation = recommendationById.get(pack.id);
          const summary = packCardSummary(pack);

          return (
            <div
              key={pack.id}
              className={`prompt-pack-row ${pack.enabled ? "pack-enabled" : ""} ${recommendation ? "pack-recommended" : ""}`}
            >
              {isEditing ? (
                <div className="pack-edit-form">
                  <input
                    className="pack-edit-input"
                    placeholder="Pack name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    aria-label="Pack name"
                  />
                  <input
                    className="pack-edit-input"
                    placeholder="Short description"
                    value={editForm.blurb}
                    onChange={(e) => setEditForm((f) => ({ ...f, blurb: e.target.value }))}
                    aria-label="Pack description"
                  />
                  <textarea
                    className="pack-edit-textarea"
                    placeholder="Pack content (markdown)"
                    value={editForm.content}
                    onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                    aria-label="Pack content"
                    rows={6}
                  />
                  <div className="pack-edit-actions">
                    <button
                      type="button"
                      className="pack-btn pack-btn-primary"
                      onClick={() => commitEdit(pack.id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="pack-btn pack-btn-secondary"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="pack-row-main">
                    <div className="pack-card-top">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={pack.enabled}
                        className={`pack-toggle ${pack.enabled ? "pack-toggle-on" : ""}`}
                        onClick={() => handleToggle(pack.id)}
                        aria-label={`${pack.enabled ? "Disable" : "Enable"} ${pack.name}`}
                      >
                        <span className="pack-toggle-thumb" />
                      </button>
                      <div className="pack-info">
                        <span className="pack-name">
                          {pack.name}
                          {recommendation ? (
                            <span className="pack-recommended-badge" title={recommendation.reason}>
                              Recommended
                            </span>
                          ) : null}
                        </span>
                        <span className="pack-blurb">{pack.blurb}</span>
                      </div>
                      <div className="pack-card-meta">
                        <em className="pack-tokens">~{packTokens} tok</em>
                        <button
                          type="button"
                          className="pack-btn pack-btn-ghost"
                          onClick={() => setDetailsPackId(pack.id)}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                    <p className="pack-card-summary">{summary.short}</p>
                    <div className="pack-card-fit">
                      <strong>Use when</strong>
                      <span>{summary.useWhen}</span>
                    </div>
                    <div className="pack-row-actions">
                      <span>{pack.enabled ? "Included in handoff" : "Available to add"}</span>
                      {pack.source === "custom" ? (
                        <div className="pack-action-group">
                          <button
                            type="button"
                            className="pack-btn pack-btn-ghost"
                            onClick={() => startEdit(pack)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="pack-btn pack-btn-ghost pack-btn-danger"
                            onClick={() => handleDelete(pack.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {!filteredPacks.length ? (
          <div className="prompt-pack-row prompt-pack-empty">
            <strong>No matching prompt packs</strong>
            <span>Try a behavior, builder, risk, design, mobile, privacy, test, or repo phrase.</span>
          </div>
        ) : null}
      </div>

      {addingNew ? (
        <div className="pack-add-form">
          <strong className="pack-add-heading">New custom pack</strong>
          <input
            className="pack-edit-input"
            placeholder="Pack name"
            value={newForm.name}
            onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            aria-label="New pack name"
            autoFocus
          />
          <input
            className="pack-edit-input"
            placeholder="Short description"
            value={newForm.blurb}
            onChange={(e) => setNewForm((f) => ({ ...f, blurb: e.target.value }))}
            aria-label="New pack description"
          />
          <textarea
            className="pack-edit-textarea"
            placeholder="Pack content (markdown, ~200-500 tokens)"
            value={newForm.content}
            onChange={(e) => setNewForm((f) => ({ ...f, content: e.target.value }))}
            aria-label="New pack content"
            rows={7}
          />
          <div className="pack-edit-actions">
            <button
              type="button"
              className="pack-btn pack-btn-primary"
              onClick={commitAdd}
            >
              Save pack
            </button>
            <button
              type="button"
              className="pack-btn pack-btn-secondary"
              onClick={cancelAdd}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="pack-add-trigger"
          onClick={() => setAddingNew(true)}
        >
          + Add custom pack
        </button>
      )}

      {detailsPack ? (
        <div className="modal-backdrop prompt-pack-modal-backdrop" role="presentation" onClick={() => setDetailsPackId(null)}>
          <section
            className="prompt-pack-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-pack-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-swipe-handle" aria-hidden="true" />
            <header className="prompt-pack-details-header">
              <div {...detailsSwipeDown}>
                <span>{detailsPack.enabled ? "Active prompt pack" : "Available prompt pack"}</span>
                <h2 id="prompt-pack-details-title">{detailsPack.name}</h2>
              </div>
              <button type="button" className="pack-btn pack-btn-secondary" onClick={() => setDetailsPackId(null)}>
                Close
              </button>
            </header>
            <div className="prompt-pack-details-body">
              <section>
                <strong>What it does</strong>
                <p>{packCardSummary(detailsPack).long}</p>
              </section>
              <section>
                <strong>Use when</strong>
                <p>{packCardSummary(detailsPack).useWhen}</p>
              </section>
              <section>
                <div className="prompt-pack-preview-head">
                  <div>
                    <strong>Source Markdown preview</strong>
                    <p className="prompt-pack-details-note">
                      {detailsPack.enabled ? "Summarized under Builder Rule Packs in the next Builder Handoff." : "Not summarized unless you toggle it on."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pack-btn pack-btn-secondary prompt-pack-copy-btn"
                    onClick={async () => {
                      setCopiedPackId(detailsPack.id);
                      await copyPackContent(detailsPack);
                    }}
                  >
                    {copiedPackId === detailsPack.id ? "Copied" : "Copy prompt"}
                  </button>
                </div>
                <pre className="pack-preview" aria-label={`${detailsPack.name} content preview`}>
                  {detailsPack.content}
                </pre>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function packCardSummary(pack: ResolvedPack) {
  const summaries: Record<string, { short: string; useWhen: string; long: string }> = {
    "repo-orientation": {
      short: "Forces the builder to inspect the starter repo, map the structure, and understand the existing app before touching code.",
      useWhen: "You are starting from a GitHub repo or template and want fewer wild guesses.",
      long: "This pack makes the AI builder slow down long enough to understand the selected starter repo: structure, entrypoints, conventions, existing flows, and relevant files. It reduces random rewrites and helps the builder reuse what is already there.",
    },
    "plan-then-edit": {
      short: "Requires a short implementation plan before risky or multi-file edits, including files, risks, and verification steps.",
      useWhen: "The change spans multiple files, touches data, or could break existing behavior.",
      long: "This pack tells the builder to inspect first, name the likely files and risks, then execute in small increments. It is useful when you want momentum without letting the AI charge into broad edits blindly.",
    },
    "karpathy-mvp": {
      short: "Keeps the build small and honest: prove the core idea with the least code that can actually work.",
      useWhen: "You are tempted to over-polish before proving the product is useful.",
      long: "This pack pushes the builder toward a tiny, useful MVP. It emphasizes simple code, checkable outcomes, targeted edits, and skipping premature abstractions until real usage proves they are needed.",
    },
    "indie-hacker-mvp": {
      short: "Optimizes for solo-founder speed: one useful vertical slice, clear value, and revenue-aware product decisions.",
      useWhen: "You need something sellable or demoable quickly without team-scale architecture.",
      long: "This pack keeps the builder focused on a coherent user journey that can create value quickly. It avoids admin sprawl, complex permissions, and heavy systems unless they are essential to the first use case.",
    },
    "incremental-mvp": {
      short: "Turns a large product idea into a sequence of usable milestones instead of one giant unfinished build.",
      useWhen: "The product feels big and you need a practical order of operations.",
      long: "This pack breaks the build into slices: shell, data model, core behavior, persistence, and polish. It helps every milestone remain runnable and useful.",
    },
    "existing-patterns": {
      short: "Makes the builder follow the repo's framework, naming, styling, helpers, and tests instead of inventing a second app inside it.",
      useWhen: "You are modifying an existing codebase and want it to feel native.",
      long: "This pack tells the AI to reuse existing components, services, schemas, routes, package manager, and testing patterns. It keeps the output consistent with the repo you chose.",
    },
    "ai-edit-over-generate": {
      short: "Stops whole-file regeneration. The builder should patch what is wrong and preserve what already works.",
      useWhen: "A design or file is mostly right, but the AI keeps starting over.",
      long: "This pack protects working context. It prefers surgical patches, preserving behavior, and fixing the wrong 20 percent instead of replacing the whole thing.",
    },
    "anti-overbuild": {
      short: "Prevents extra frameworks, unused screens, fake settings, and enterprise features nobody asked for.",
      useWhen: "You want a clean MVP and are worried the builder will add unnecessary complexity.",
      long: "This pack keeps the builder honest about scope. It favors small limitations over fake completeness and pushes unused scaffolding out of the build.",
    },
    "test-first-verification": {
      short: "Requires the builder to prove changes with the repo's own tests, build checks, or targeted verification.",
      useWhen: "You need confidence the change actually works, not just a pretty summary.",
      long: "This pack makes verification part of the work. It asks the builder to identify relevant checks, add tests when needed, and say what remains unverified if a check cannot run.",
    },
    "no-silent-success": {
      short: "Stops fake green states: errors, empty results, invalid keys, and demo data must be labeled honestly.",
      useWhen: "The product connects to real APIs, audits, exports, or user data where fake success would hurt trust.",
      long: "This pack prevents the AI from hiding failures behind success-shaped UI. It surfaces API failures, missing credentials, partial exports, and demo data clearly.",
    },
  };

  return summaries[pack.id] ?? {
    short: pack.blurb || "Adds reusable builder instructions to the exported handoff.",
    useWhen: "You want this rule summarized in future AI builder handoffs.",
    long: pack.blurb || "This custom pack provides Markdown source that ForkFirst summarizes under Builder Rule Packs so your coding agent follows the rule during implementation.",
  };
}
