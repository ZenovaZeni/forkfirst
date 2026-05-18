import crypto from "node:crypto";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import type { IdeaCheckResult } from "@/types/idea-check";
import { getDb } from "./client";

export type ResearchCase = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export function listResearchCases(): ResearchCase[] {
  const rows = getDb()
    .prepare("SELECT id, name, description, created_at, updated_at FROM research_cases ORDER BY updated_at DESC")
    .all() as Array<{ id: string; name: string; description: string; created_at: string; updated_at: string }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export function createResearchCase(name: string, description = ""): ResearchCase {
  const now = new Date().toISOString();
  const researchCase = {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: now,
    updatedAt: now
  };

  getDb()
    .prepare("INSERT INTO research_cases (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .run(researchCase.id, researchCase.name, researchCase.description, researchCase.createdAt, researchCase.updatedAt);

  return researchCase;
}

export function saveIdeaCheck(result: IdeaCheckResult, caseId?: string): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO idea_checks (id, case_id, prompt, verdict, summary, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(result.id, caseId ?? null, result.prompt, result.verdict, result.summary, JSON.stringify(result), result.createdAt);
}

export function saveRepo(caseId: string, repo: ClassifiedRepo, note = ""): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO saved_repos (id, case_id, full_name, url, category, note, payload, saved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      `${caseId}:${repo.fullName}`,
      caseId,
      repo.fullName,
      repo.url,
      repo.category,
      note,
      JSON.stringify(repo),
      new Date().toISOString()
    );
}

