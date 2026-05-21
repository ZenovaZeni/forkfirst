"use client";

import { AlertTriangle, BookOpen, ExternalLink, GitFork, Home, Search, Trash2, X } from "lucide-react";
import { buildRepoNarrative } from "@/lib/analysis/human-answer";
import { useSlideDismiss } from "@/components/use-slide-dismiss";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { defaultBoard, repoBoards } from "@/lib/repos/boards";
import { safeProjectSiteUrl } from "@/lib/url/project-site";

type SavedRepoModalProps = {
  repo: ClassifiedRepo;
  onClose: () => void;
  board?: string;
  isSaved?: boolean;
  onBoardChange?: (repo: ClassifiedRepo, board: string) => void;
  onDelete?: (repo: ClassifiedRepo) => void;
};

function licenseWarning(repo: ClassifiedRepo): string {
  if (!repo.license) return "No license was detected. Treat this as reference-only until you confirm reuse rights in the repo.";
  const license = repo.license.toUpperCase();
  if (license.includes("GPL") || license.includes("AGPL") || license.includes("LGPL")) {
    return `${repo.license} can carry reciprocal obligations. Confirm compatibility before copying code into your project.`;
  }
  return `${repo.license} is detected, but still verify the LICENSE file, third-party assets, generated code, and dependency licenses before reuse.`;
}

function inspectionSteps(repo: ClassifiedRepo): string[] {
  return [
    repo.readme?.hasSetup ? "Run the documented setup path in a clean checkout." : "Find the install/setup path before assuming this can be reused.",
    repo.readme?.hasExamples ? "Open the examples or demo and compare the workflow to your idea." : "Look for examples, screenshots, or tests that prove the core workflow.",
    "Scan recent commits, releases, and issue replies for maintenance risk.",
    "Confirm the license file and any asset/model/data restrictions before copying code."
  ];
}

export function SavedRepoModal({ repo, onClose, board, isSaved = false, onBoardChange, onDelete }: SavedRepoModalProps) {
  const narrative = buildRepoNarrative(repo);
  const currentBoard = board ?? defaultBoard(repo);
  const steps = inspectionSteps(repo);
  const slideDismiss = useSlideDismiss(onClose);
  const projectSite = safeProjectSiteUrl(repo.homepage, { repoUrl: repo.url, fullName: repo.fullName });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="saved-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        {...slideDismiss}
      >
        <div className="saved-modal-header">
          <div>
            <span className="category-pill">{repo.category.replace("_", " ")}</span>
            <h2 id="saved-modal-title">{repo.fullName}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close saved repo details" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="saved-modal-health" aria-label="Repo health">
          <span>{repo.score.total}% match</span>
          <span>{repo.stars.toLocaleString()} stars</span>
          <span>{repo.forks.toLocaleString()} forks</span>
          <span>{repo.language ?? "Mixed"}</span>
          <span>{repo.license ?? "No license"}</span>
          <span>{repo.readme ? `Docs ${repo.readme.qualityScore}%` : "Docs unknown"}</span>
        </div>

        <div className="saved-modal-sections">
          <div className="saved-modal-section saved-modal-section-wide">
            <strong>What it is</strong>
            <p>{narrative.overview}</p>
          </div>

          <div className="saved-modal-section saved-modal-section-wide">
            <strong>Why it matched</strong>
            <p>{narrative.why}</p>
            {repo.score.reasons.length ? (
              <ul className="saved-modal-reason-list">
                {repo.score.reasons.slice(0, 4).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="saved-modal-section">
            <strong>When to use it</strong>
            <p>{narrative.goodFor}</p>
          </div>

          <div className="saved-modal-section">
            <strong>When not to use it</strong>
            <p>{narrative.notFor}</p>
          </div>

          <div className="saved-modal-section saved-modal-section-wide">
            <strong>First inspection steps</strong>
            <ol>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="saved-modal-warning saved-modal-section-wide">
            <AlertTriangle size={17} aria-hidden="true" />
            <div>
              <strong>License and reuse warning</strong>
              <p>{licenseWarning(repo)}</p>
              <p>{narrative.caution}</p>
            </div>
          </div>
        </div>

        <div className="saved-modal-next">
          <Search size={17} aria-hidden="true" />
          <p>
            <strong>Best next step:</strong> {narrative.next}
          </p>
        </div>

        {isSaved || onBoardChange ? (
          <label className="saved-modal-board">
            <span>Saved board</span>
            <select value={currentBoard} onChange={(event) => onBoardChange?.(repo, event.target.value)}>
              {repoBoards.map((boardOption) => (
                <option key={boardOption} value={boardOption}>
                  {boardOption}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="saved-modal-actions">
          <a className="github-action" href={repo.url} target="_blank" rel="noreferrer">
            <GitFork size={14} />
            View GitHub
            <ExternalLink size={14} />
          </a>
          {repo.readme?.url ? (
            <a className="github-action secondary-action" href={repo.readme.url} target="_blank" rel="noreferrer">
              <BookOpen size={14} />
              Read README
              <ExternalLink size={14} />
            </a>
          ) : null}
          {projectSite ? (
            <a className="github-action secondary-action" href={projectSite} target="_blank" rel="noreferrer">
              <Home size={14} />
              Open homepage
              <ExternalLink size={14} />
            </a>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="delete-action"
              onClick={() => onDelete(repo)}
              aria-label={`Remove ${repo.fullName} from saved library`}
            >
              <Trash2 size={14} />
              Remove saved repo
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
