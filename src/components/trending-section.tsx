"use client";

import { useEffect, useRef, useState } from "react";
import { Star, TrendingUp } from "lucide-react";
import { TRENDING_CATEGORIES, type TrendingCategory } from "@/lib/trending/categories";
import { LEGACY_REDESIGN_STORAGE_KEYS, REDESIGN_STORAGE_KEYS } from "@/lib/redesign/feature-model";
import type { TrendingRepo } from "@/app/api/trending/route";
import styles from "./trending-section.module.css";

type TrendingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; repos: TrendingRepo[] }
  | { status: "error" };

type Props = {
  githubToken?: string;
  /** When true, renders a larger full-page layout (used on /trending) */
  fullPage?: boolean;
};

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonLine} style={{ width: "60%", marginBottom: 10 }} />
      <div className={styles.skeletonLine} style={{ width: "90%", marginBottom: 6 }} />
      <div className={styles.skeletonLine} style={{ width: "75%" }} />
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonPill} />
        <div className={styles.skeletonPill} />
      </div>
    </div>
  );
}

function RepoCard({
  repo,
  savedNames,
  onSave
}: {
  repo: TrendingRepo;
  savedNames: Set<string>;
  onSave: (repo: TrendingRepo) => void;
}) {
  const isSaved = savedNames.has(repo.fullName);

  function handleBuildHandoff() {
    const url = new URL("/", window.location.href);
    url.searchParams.set("fork", repo.fullName);
    window.location.href = url.toString();
  }

  return (
    <div className={styles.repoCard}>
      <div className={styles.cardTop}>
        <a
          className={styles.repoName}
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={repo.fullName}
        >
          {repo.fullName}
        </a>
        <p className={styles.repoDesc}>{repo.description || <span className={styles.noDesc}>No description</span>}</p>
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.starBadge}>
          <Star size={12} aria-hidden="true" />
          {formatStars(repo.stars)}
        </span>
        {repo.language ? <span className={styles.langPill}>{repo.language}</span> : null}
        {repo.license ? <span className={styles.licensePill}>{repo.license}</span> : null}
      </div>
      <div className={styles.cardActions}>
        <button
          type="button"
          className={isSaved ? styles.btnSaved : styles.btnSave}
          onClick={() => onSave(repo)}
          title={isSaved ? "Saved to library" : "Save to library"}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          className={styles.btnHandoff}
          onClick={handleBuildHandoff}
          title="Build a handoff from this repo"
        >
          Build Handoff
        </button>
      </div>
    </div>
  );
}

export function TrendingSection({ githubToken, fullPage = false }: Props) {
  const [activeId, setActiveId] = useState<TrendingCategory["id"]>("ai-agents");
  const [cache, setCache] = useState<Partial<Record<TrendingCategory["id"], TrendingRepo[]>>>({});
  const [state, setState] = useState<TrendingState>({ status: "idle" });
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const fetching = useRef<string | null>(null);

  // Load saved repos from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(REDESIGN_STORAGE_KEYS.savedRepos) ?? window.localStorage.getItem(LEGACY_REDESIGN_STORAGE_KEYS.savedRepos);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{ fullName: string }>;
        setSavedNames(new Set(parsed.map((r) => r.fullName)));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (cache[activeId]) {
      setState({ status: "ok", repos: cache[activeId]! });
      return;
    }

    if (fetching.current === activeId) return;
    fetching.current = activeId;
    setState({ status: "loading" });

    const body: { categoryId: string; githubToken?: string } = { categoryId: activeId };
    if (githubToken) body.githubToken = githubToken;

    fetch("/api/trending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then((r) => r.json())
      .then((data: { repos?: TrendingRepo[]; error?: string }) => {
        if (data.repos) {
          setCache((prev) => ({ ...prev, [activeId]: data.repos! }));
          setState({ status: "ok", repos: data.repos! });
        } else {
          setState({ status: "error" });
        }
      })
      .catch(() => setState({ status: "error" }))
      .finally(() => {
        fetching.current = null;
      });
  }, [activeId, cache, githubToken]);

  function handleSave(repo: TrendingRepo) {
    // Build a minimal ClassifiedRepo-compatible object and save to localStorage
    const stored = window.localStorage.getItem(REDESIGN_STORAGE_KEYS.savedRepos) ?? window.localStorage.getItem(LEGACY_REDESIGN_STORAGE_KEYS.savedRepos);
    let existing: Array<Record<string, unknown>> = [];
    try {
      if (stored) existing = JSON.parse(stored) as Array<Record<string, unknown>>;
    } catch {
      existing = [];
    }

    const alreadySaved = existing.find((r) => r.fullName === repo.fullName);
    if (alreadySaved) {
      // Toggle off
      const next = existing.filter((r) => r.fullName !== repo.fullName);
      window.localStorage.setItem(REDESIGN_STORAGE_KEYS.savedRepos, JSON.stringify(next));
      setSavedNames((prev) => {
        const next = new Set(prev);
        next.delete(repo.fullName);
        return next;
      });
      return;
    }

    const [owner, name] = repo.fullName.split("/");
    const classifiedRepo = {
      id: Date.now(),
      owner: owner ?? "",
      name: name ?? "",
      fullName: repo.fullName,
      url: repo.htmlUrl,
      description: repo.description,
      language: repo.language,
      topics: repo.topics,
      stars: repo.stars,
      forks: 0,
      openIssues: 0,
      license: repo.license,
      pushedAt: repo.updatedAt,
      createdAt: null,
      updatedAt: repo.updatedAt,
      archived: false,
      homepage: null,
      category: "reference" as const,
      score: {
        total: 60,
        fit: 60,
        activity: 60,
        popularity: 60,
        license: 60,
        docs: 60,
        reasons: ["Saved from Trending"]
      },
      summary: `Trending repo: ${repo.description || repo.fullName}`
    };

    const next = [classifiedRepo, ...existing].slice(0, 30);
    window.localStorage.setItem(REDESIGN_STORAGE_KEYS.savedRepos, JSON.stringify(next));
    setSavedNames((prev) => new Set([...prev, repo.fullName]));
  }

  const activeCategory = TRENDING_CATEGORIES.find((c) => c.id === activeId)!;

  return (
    <section className={fullPage ? styles.sectionFull : styles.section}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <TrendingUp size={20} className={styles.headerIcon} aria-hidden="true" />
          <div>
            <h2 className={styles.heading}>
              {fullPage ? "Live GitHub repos by category" : "Live GitHub starters"}
            </h2>
            <p className={styles.subheading}>Public repos pushed in the last 30 days, sorted by star count</p>
          </div>
        </div>
      </div>

      <div className={styles.tabStrip} role="tablist" aria-label="Trending categories">
        {TRENDING_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={cat.id === activeId}
            className={cat.id === activeId ? styles.tabActive : styles.tab}
            onClick={() => setActiveId(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {activeCategory && (
        <p className={styles.blurb}>{activeCategory.blurb}</p>
      )}

      <div className={styles.grid} role="tabpanel">
        {state.status === "loading" &&
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {state.status === "ok" &&
          state.repos.map((repo) => (
            <RepoCard
              key={repo.fullName}
              repo={repo}
              savedNames={savedNames}
              onSave={handleSave}
            />
          ))}

        {state.status === "error" && (
          <div className={styles.errorState}>
            Couldn&apos;t load trending — try again later.
          </div>
        )}
      </div>
    </section>
  );
}
