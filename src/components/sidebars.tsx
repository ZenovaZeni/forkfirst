import { Bookmark, Download, KeyRound, Plus, SearchCheck, X } from "lucide-react";
import { KeySettings, type UserKeys } from "./key-settings";
import { TokenSavingsCard } from "./token-savings-card";
import type { KeyVerificationState } from "@/lib/keys/key-status";
import { keyStatusLabel } from "@/lib/keys/key-status";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { defaultBoard } from "@/lib/repos/boards";
import { formatEstimatedCost, summarizeUsage, type UsageEntry } from "@/lib/usage/costs";
import type { SavingsLog } from "@/lib/usage/savings";
import type { IdeaCheckResult } from "@/types/idea-check";
import type { ResearchChat, ResearchFolder } from "@/types/research-chat";
import { PromptPacksPanel } from "./prompt-packs-panel";
import type { PromptPackState } from "@/lib/prompt-packs/storage";

export type DrawerMode = "leads" | "saved" | "export" | "keys";
type AppAccent = "cobalt" | "ember" | "forest" | "violet";

type SidebarsProps = {
  mode: DrawerMode;
  savedRepos: ClassifiedRepo[];
  savedRepoBoards: Record<string, string>;
  currentResult: IdeaCheckResult | null;
  freshLeadNames?: string[];
  keys: UserKeys;
  onKeysChange: (keys: UserKeys) => void;
  verification: KeyVerificationState;
  verifyingKeys: boolean;
  usageEntries: UsageEntry[];
  savingsLog: SavingsLog;
  onVerifyKeys: (keys: UserKeys) => void;
  onResetUsage: () => void;
  onOpenRepo: (repo: ClassifiedRepo) => void;
  onAskAboutRepo: (repo: ClassifiedRepo) => void;
  onSaveRepo: (repo: ClassifiedRepo) => void;
  onSetRepoBoard: (repo: ClassifiedRepo, board: string) => void;
  onExportReport: () => void;
  onCopyReport: () => void;
  onClose?: () => void;
  rememberKeys: boolean;
  onRememberKeysChange: (remember: boolean) => void;
  onClearAllData: () => void;
  onShowWelcome: () => void;
  promptPackState?: PromptPackState;
  onPromptPackStateChange?: (next: PromptPackState) => void;
  theme: "paper" | "ink";
  accent: AppAccent;
  onToggleTheme: () => void;
  onAccentChange: (accent: AppAccent) => void;
};

export function LeftSidebar({
  chats,
  activeChatId,
  savingsLog,
  onNewCheck,
  onOpenSaved,
  onOpenKeys,
  onOpenExport,
  onToggleTheme,
  theme,
  onSelectChat
}: {
  chats: ResearchChat[];
  activeChatId: string | null;
  savingsLog: SavingsLog;
  onNewCheck: () => void;
  onOpenSaved: () => void;
  onOpenKeys: () => void;
  onOpenExport: () => void;
  onToggleTheme: () => void;
  theme: "paper" | "ink";
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, title: string) => void;
  onTogglePin: (chatId: string) => void;
  onMoveChat: (draggedChatId: string, targetChatId: string, targetPinned: boolean) => void;
  onMoveChatToEnd: (draggedChatId: string, targetPinned: boolean) => void;
  deleteDisabled?: boolean;
  folders: ResearchFolder[];
  onCreateFolder: (name?: string) => string;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderCollapsed: (folderId: string) => void;
  onMoveChatToFolder: (chatId: string, folderId: string | null) => void;
}) {
  function renderChat(chat: ResearchChat, index: number) {
    const label = chat.id === activeChatId ? "now" : index === 1 ? "2h" : index === 2 ? "Yesterday" : index === 3 ? "Mon" : "";
    return (
      <button
        key={chat.id}
        className={`rail-item ${chat.id === activeChatId ? "active" : ""}`}
        type="button"
        onClick={() => onSelectChat(chat.id)}
      >
        <span className="ttl">{chat.title}</span>
        {label ? <span className="when">{label}</span> : null}
      </button>
    );
  }

  return (
    <aside className="sidebar left-sidebar">
      <div className="brand brand-row">
        <div className="mark" aria-hidden="true" />
        <div>
          <strong>ForkFirst</strong>
          <span>Idea check, before you build</span>
        </div>
      </div>
      <button className="new-btn new-check" type="button" onClick={onNewCheck}>
        <Plus size={16} aria-hidden="true" />
        New idea check
      </button>
      <p className="rail-label">Recent</p>
      {chats.length === 0 ? (
        <div className="empty-save">
          <span>Start with an idea or repo question.</span>
        </div>
      ) : (
        <div className="rail-root-drop">
          {chats.slice(0, 5).map(renderChat)}
        </div>
      )}
      <div className="left-sidebar-bottom" aria-label="ForkFirst utilities">
        <TokenSavingsCard savings={savingsLog} />
        <nav className="left-utility-nav">
          <a href="/trending">Trending</a>
          <button type="button" onClick={onOpenKeys}>Prompt packs</button>
          <button type="button" onClick={onOpenSaved}>Library</button>
          <button type="button" onClick={onOpenExport}>Handoff</button>
          <button type="button" onClick={onOpenKeys}>Settings</button>
          <button type="button" onClick={onToggleTheme}>{theme === "paper" ? "Dark mode" : "Light mode"}</button>
        </nav>
      </div>
    </aside>
  );
}

export function MobileHeader({
  theme,
  accent,
  onToggleTheme,
  onAccentChange,
  onNewCheck,
  onOpenSaved,
  onOpenKeys
}: {
  theme: "paper" | "ink";
  accent: AppAccent;
  onToggleTheme: () => void;
  onAccentChange: (accent: AppAccent) => void;
  onNewCheck: () => void;
  onOpenSaved: () => void;
  onOpenKeys: () => void;
}) {
  return (
    <header className="mobile-header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true" />
        <div>
          <strong>ForkFirst</strong>
          <span>Idea check, before you build</span>
        </div>
      </div>
      <div className="mobile-header-actions">
        <button className="new-check theme-toggle-mobile" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === "paper" ? "ink" : "paper"} mode`}>
          {theme === "paper" ? "Ink" : "Paper"}
        </button>
        <label className="mobile-accent-picker" aria-label="Accent color">
          <span className="sr-only">Accent</span>
          <select value={accent} onChange={(event) => onAccentChange(event.target.value as AppAccent)}>
            <option value="cobalt">Cobalt</option>
            <option value="ember">Ember</option>
            <option value="forest">Forest</option>
            <option value="violet">Violet</option>
          </select>
        </label>
        <button className="new-check" type="button" onClick={onOpenSaved} aria-label="Open saved repos">
          <Bookmark size={16} />
          Library
        </button>
        <button className="new-check" type="button" onClick={onOpenKeys} aria-label="Open settings">
          <KeyRound size={16} />
          Settings
        </button>
        <button className="new-check mobile-new-check" type="button" onClick={onNewCheck}>
          <Plus size={16} />
          New
        </button>
      </div>
    </header>
  );
}

export function RightSidebar({
  mode,
  savedRepos,
  savedRepoBoards,
  currentResult,
  freshLeadNames = [],
  keys,
  onKeysChange,
  verification,
  verifyingKeys,
  usageEntries,
  savingsLog,
  onVerifyKeys,
  onResetUsage,
  onOpenRepo,
  onSaveRepo,
  onExportReport,
  onCopyReport,
  onClose,
  rememberKeys,
  onRememberKeysChange,
  onClearAllData,
  onShowWelcome,
  promptPackState,
  onPromptPackStateChange,
  theme,
  accent,
  onToggleTheme,
  onAccentChange
}: SidebarsProps) {
  const currentRepos = currentResult?.repos.slice(0, 6) ?? [];
  const savedRepoNames = new Set(savedRepos.map((repo) => repo.fullName));
  const freshLeadSet = new Set(freshLeadNames);
  const usageSummary = summarizeUsage(usageEntries);
  const title = {
    leads: "Current leads",
    saved: "Saved library",
    export: "Export",
    keys: "Settings"
  }[mode];
  const subtitle = {
    leads: currentResult ? `${currentResult.repos.length} matches in this chat` : "Best matches stay here",
    saved: `${savedRepos.length} saved repos`,
    export: currentResult ? "Download a Markdown idea report" : "Run a check before exporting",
    keys: "Keys and usage"
  }[mode];

  return (
    <aside className={`sidebar right-sidebar right-sidebar-${mode}`}>
      <div className="drawer-panel-header">
        <div>
          <p className="rail-label">{title}</p>
          <strong>{subtitle}</strong>
        </div>
        {onClose ? (
          <button className="icon-button" type="button" aria-label={`Close ${title}`} onClick={onClose}>
            <X size={16} />
          </button>
        ) : null}
      </div>

      {mode === "leads" ? (
        <>
          <p className="rail-context">Only repos from the active chat show here. Saved repos live in the Saved drawer.</p>
          {currentRepos.length === 0 ? (
            <div className="empty-save">
              <SearchCheck size={18} />
              <span>Ask a repo question and the best matches will stay here.</span>
            </div>
          ) : (
            <div className="lead-tray" aria-label="Current repo leads">
              {currentRepos.map((repo, index) => (
                <article className={`lead-repo ${freshLeadSet.has(repo.fullName) ? "fresh" : ""}`} key={repo.fullName}>
                  <button className="lead-open" type="button" onClick={() => onOpenRepo(repo)}>
                    <span className="lead-rank">#{index + 1}</span>
                    <strong>{repo.fullName}</strong>
                    <span>
                      {repo.category.replace("_", " ")} - {repo.score.total}% - {repo.stars.toLocaleString()} stars
                    </span>
                  </button>
                  <button
                    className={`lead-save ${savedRepoNames.has(repo.fullName) ? "saved" : ""}`}
                    type="button"
                    onClick={() => onSaveRepo(repo)}
                    title={savedRepoNames.has(repo.fullName) ? "Remove from saved repos" : "Save repo for later"}
                  >
                    {savedRepoNames.has(repo.fullName) ? "Unsave" : "Save"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}

      {mode === "saved" ? (
        <>
          <p className="rail-context">
            Saved repos live in your browser only — clear browser data to remove them. No cloud sync yet.
          </p>
          <p className="rail-context">Your full saved repo library across chats. Use Ask to continue the active chat with a saved repo.</p>
          {savedRepos.length === 0 ? (
            <div className="empty-save">
              <Bookmark size={18} />
              <span>Save a lead to keep it here for later.</span>
            </div>
          ) : null}
          {savedRepos.length > 0 ? (
            <>
              <div className="saved-rail-list" aria-label="Saved repos">
                {savedRepos.slice(0, 3).map((repo) => {
                  const board = savedRepoBoards[repo.fullName] ?? defaultBoard(repo);
                  return (
                    <button className="saved-rail-card" type="button" key={repo.fullName} onClick={() => onOpenRepo(repo)}>
                      <strong>{repo.fullName}</strong>
                      <span>
                        {board} · {repo.score.total}% match
                      </span>
                    </button>
                  );
                })}
              </div>
              {savedRepos.length > 3 ? <p className="rail-context compact-only">{savedRepos.length - 3} more saved repos live in Library.</p> : null}
            </>
          ) : null}
          <div className="rail-promise">
            <h3>What this gives you</h3>
            <p>
              Each idea check produces a <strong>Builder Handoff</strong> your AI builder can read top to bottom: the plan,
              the repo to fork, the rules, and the brand.
            </p>
          </div>
        </>
      ) : null}

      {mode === "export" ? (
        <>
          <div className="drawer-export-card">
            <Download size={18} />
            <div>
              <strong>Idea report</strong>
              <span>Exports the original prompt, top repos, tradeoffs, risks, saved repos, and MVP recommendation.</span>
            </div>
          </div>
          <button className="export-report-button" type="button" onClick={onExportReport} disabled={!currentResult}>
            <Download size={14} />
            Download Markdown report
          </button>
          <button className="export-report-button secondary" type="button" onClick={onCopyReport} disabled={!currentResult}>
            Copy Markdown report
          </button>
          {!currentResult ? <p className="rail-context">Run a repo search first, then come back here to export the report.</p> : null}
          <p className="rail-context">
            License and reuse fields are advisory. Check each repo&apos;s LICENSE file before copying or forking.
          </p>
        </>
      ) : null}

      {mode === "keys" ? (
        <>
          <p className="rail-context">
            Bring your own keys. They are kept in sessionStorage by default, sent only for requests you trigger, and written to persistent localStorage only if you turn on Remember keys.
          </p>
          <section className="appearance-card" aria-label="Appearance settings">
            <div className="appearance-card-heading">
              <strong>Appearance</strong>
              <span>Make ForkFirst feel right on your machine.</span>
            </div>
            <div className="appearance-toggle" role="group" aria-label="Theme">
              <button type="button" className={theme === "paper" ? "active" : ""} onClick={theme === "paper" ? undefined : onToggleTheme}>
                Paper
              </button>
              <button type="button" className={theme === "ink" ? "active" : ""} onClick={theme === "ink" ? undefined : onToggleTheme}>
                Ink
              </button>
            </div>
            <label className="appearance-select">
              <span>Accent</span>
              <select value={accent} onChange={(event) => onAccentChange(event.target.value as AppAccent)}>
                <option value="cobalt">Cobalt</option>
                <option value="ember">Ember</option>
                <option value="forest">Forest</option>
                <option value="violet">Violet</option>
              </select>
            </label>
          </section>
          <KeySettings
            keys={keys}
            onChange={onKeysChange}
            verification={verification}
            verifying={verifyingKeys}
            onVerify={onVerifyKeys}
            rememberKeys={rememberKeys}
            onRememberKeysChange={onRememberKeysChange}
            onClearAllData={onClearAllData}
            onShowWelcome={onShowWelcome}
          />
          <div className="key-status">
            <span className={verification.github}>{`GitHub ${keyStatusLabel(verification.github)}`}</span>
            <span className={verification.ai}>{`AI ${keyStatusLabel(verification.ai)}`}</span>
          </div>
          <section className="usage-card" aria-label="Estimated AI usage">
            <div className="usage-card-heading">
              <span>Estimated usage</span>
              <strong>{formatEstimatedCost(usageSummary.estimatedCostUsd)}</strong>
            </div>
            <p>Local estimate only. Provider dashboards are the source of truth.</p>
            <div className="usage-stats">
              <span>{usageSummary.entries} calls</span>
              <span>{usageSummary.inputTokens.toLocaleString()} in</span>
              <span>{usageSummary.outputTokens.toLocaleString()} out</span>
            </div>
            {usageEntries[0] ? (
              <small>
                Last: {usageEntries[0].provider} / {usageEntries[0].model} using {usageEntries[0].rateLabel}
              </small>
            ) : (
              <small>No AI usage logged in this browser yet.</small>
            )}
            <button type="button" onClick={onResetUsage} disabled={usageEntries.length === 0}>
              Reset estimate
            </button>
          </section>
          <TokenSavingsCard savings={savingsLog} />
          {promptPackState && onPromptPackStateChange ? (
            <PromptPacksPanel
              state={promptPackState}
              onChange={onPromptPackStateChange}
            />
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
