"use client";

import { useState } from "react";
import type { IdeaCheckResult } from "@/types/idea-check";
import { DiscoveryRadar } from "./discovery-radar";
import { IdeaGap } from "./idea-gap";
import { RepoCard } from "./repo-card";
import { TopRepoCompare } from "./top-repo-compare";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { buildAnswerHeadline, buildAnswerSections, buildRepoNarrative } from "@/lib/analysis/human-answer";

type VerdictReportProps = {
  result: IdeaCheckResult;
  savedRepoNames: Set<string>;
  onSaveRepo: (repo: ClassifiedRepo) => void;
};

export function VerdictReport({ result, savedRepoNames, onSaveRepo }: VerdictReportProps) {
  const [showMore, setShowMore] = useState(false);
  const topRepos = result.repos.slice(0, 3);
  const moreRepos = result.repos.slice(3);
  const answer = buildAnswerSections(result.prompt, result.repos);
  const headline = buildAnswerHeadline(result.prompt, result.repos);
  const leadNarrative = topRepos[0] ? buildRepoNarrative(topRepos[0]) : null;

  return (
    <section className="answer-panel">
      <div className="result-hero" id="answer">
        <div className="result-main">
          <p className="eyebrow">Answer</p>
          <h2>{headline}</h2>
          <div className="answer-summary">
            <p>{answer.intro}</p>
            {topRepos[0] ? (
              <div className="answer-verdict-grid">
                <div>
                  <span>Best lead</span>
                  <strong>{topRepos[0].fullName}</strong>
                </div>
                <div>
                  <span>Type</span>
                  <strong>{leadNarrative?.kindLabel}</strong>
                </div>
                <div>
                  <span>Decision</span>
                  <strong>{topRepos[0].category.replace("_", " ")}</strong>
                </div>
                <div>
                  <span>Use it for</span>
                  <strong>{leadNarrative?.goodFor}</strong>
                </div>
              </div>
            ) : null}
          </div>
          <div className="result-actions">
            {topRepos[0] ? <span>Best match: {topRepos[0].fullName}</span> : null}
            {moreRepos.length > 0 ? <span>{moreRepos.length} more found</span> : null}
          </div>
        </div>
        <div className="confidence result-confidence">
          <span>{result.confidence}%</span>
          <small>{result.mode === "demo" ? "demo mode" : "AI analysis"}</small>
        </div>
      </div>

      {result.warnings.length > 0 ? (
        <div className="warnings">
          {result.warnings.map((warning) => (
            <p key={`${warning.type}:${warning.message}`}>{warning.message}</p>
          ))}
        </div>
      ) : null}

      <section className="top-repos" id="repos">
        <div className="section-heading">
          <p className="eyebrow">Details</p>
          <h3>Plain-English repo notes</h3>
        </div>
        {topRepos.length > 0 ? (
          <div className="top-repo-grid">
            {topRepos.map((repo, index) => (
              <RepoCard
                key={repo.fullName}
                repo={repo}
                rank={index + 1}
                featured
                saved={savedRepoNames.has(repo.fullName)}
                onSave={onSaveRepo}
              />
            ))}
          </div>
        ) : (
          <div className="empty-results">No strong GitHub matches came back. Try a more specific idea or add provider keys.</div>
        )}
      </section>

      <details className="analysis-drawer">
        <summary>More analysis</summary>
        <div id="compare">
          <TopRepoCompare repos={topRepos} />
        </div>
        <IdeaGap prompt={result.prompt} repos={result.repos} analystGaps={result.gaps} />

        <div className="answer-grid">
          <div className="repo-list">
            <div className="section-heading compact-heading">
              <p className="eyebrow">More Results</p>
              <h3>Compare if needed</h3>
            </div>
            {(showMore ? moreRepos : moreRepos.slice(0, 2)).map((repo) => (
              <RepoCard
                key={repo.fullName}
                repo={repo}
                compact
                saved={savedRepoNames.has(repo.fullName)}
                onSave={onSaveRepo}
              />
            ))}
            {moreRepos.length > 2 ? (
              <button className="view-more-button" onClick={() => setShowMore((current) => !current)}>
                {showMore ? "Show fewer" : `View ${moreRepos.length - 2} more`}
              </button>
            ) : null}
          </div>
          <div id="map">
            <DiscoveryRadar prompt={result.prompt} repos={result.repos} />
          </div>
        </div>
      </details>

    </section>
  );
}
