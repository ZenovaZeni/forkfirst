"use client";

import { useState } from "react";
import { Bookmark, Check, ChevronDown, ChevronUp, ExternalLink, GitFork, Star } from "lucide-react";
import { buildRepoNarrative } from "@/lib/analysis/human-answer";
import type { ClassifiedRepo } from "@/lib/analysis/types";

const categoryLabels = {
  already_exists: "Already built",
  forkable: "Good starting point",
  reference: "Worth a look",
  gap: "Gap",
  risk: "Risky"
};

type RepoCardProps = {
  repo: ClassifiedRepo;
  rank?: number;
  featured?: boolean;
  compact?: boolean;
  saved?: boolean;
  onSave?: (repo: ClassifiedRepo) => void;
};

export function usefulnessFor(repo: ClassifiedRepo): string {
  return buildRepoNarrative(repo).why;
}

export function cautionFor(repo: ClassifiedRepo): string {
  return buildRepoNarrative(repo).caution;
}

export function nextStepFor(repo: ClassifiedRepo): string {
  return buildRepoNarrative(repo).next;
}

export function RepoCard({ repo, rank, featured = false, compact = false, saved = false, onSave }: RepoCardProps) {
  const narrative = buildRepoNarrative(repo);
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`repo-card ${repo.category} ${featured ? "featured-repo" : ""} ${compact ? "compact-repo" : ""}`}>
      <div className="repo-card-header">
        <div>
          {rank ? <span className="rank-badge">#{rank}</span> : null}
          <a href={repo.url} target="_blank" rel="noreferrer" className="repo-name">
            {repo.fullName}
            <ExternalLink size={13} />
          </a>
          <div className="repo-type-row">
            <span className="repo-kind-pill">{narrative.kindLabel}</span>
          </div>
          <p>{narrative.overview}</p>
        </div>
        <span className="category-pill">{categoryLabels[repo.category]}</span>
      </div>
      <div className="repo-meter">
        <span style={{ width: `${repo.score.total}%` }} />
      </div>
      <div className="repo-meta">
        <span>
          <Star size={13} /> {repo.stars.toLocaleString()}
        </span>
        <span>
          <GitFork size={13} /> {repo.forks.toLocaleString()}
        </span>
        <span>{repo.language ?? "Mixed"}</span>
        <span>{repo.license ?? "No license"}</span>
        <span>Docs {repo.readme ? `${repo.readme.qualityScore}%` : "unknown"}</span>
      </div>
      {expanded ? (
        <div className="repo-expanded">
          <div className="usefulness">
            <div>
              <strong>What it is good for</strong>
              <p>{narrative.goodFor}</p>
            </div>
            <div>
              <strong>Not good for</strong>
              <p>{narrative.notFor}</p>
            </div>
            <div>
              <strong>Next step</strong>
              <p>{narrative.next}</p>
            </div>
          </div>
          {featured ? (
            <div className="why-chosen">
              <strong>Signals</strong>
              <ul>
                {repo.score.reasons.slice(0, 3).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="repo-actions">
        <button className="learn-more-action" type="button" onClick={() => setExpanded((current) => !current)}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Show less" : "Learn more"}
        </button>
        <button
          type="button"
          className={`save-action ${saved ? "saved" : ""}`}
          onClick={() => onSave?.(repo)}
          disabled={saved}
          aria-label={saved ? `${repo.fullName} is saved to your library` : `Save ${repo.fullName} to your library`}
        >
          {saved ? <Check size={14} /> : <Bookmark size={14} />}
          {saved ? "Saved" : "Save"}
        </button>
        <a href={repo.url} target="_blank" rel="noreferrer" className="github-action">
          View GitHub
          <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}
