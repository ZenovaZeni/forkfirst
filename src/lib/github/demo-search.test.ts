import { describe, expect, test } from "vitest";
import { searchCuratedRepos } from "./demo-search";

describe("searchCuratedRepos", () => {
  test("job tracker idea returns job-tracking repos", () => {
    const { repos, matched } = searchCuratedRepos("build a job application tracker with kanban");
    expect(matched).toBe(true);
    expect(repos.length).toBeGreaterThan(0);
    expect(repos.some((r) => /job|career|hire/i.test(r.description) || /job|hire/i.test(r.fullName))).toBe(true);
  });

  test("crm idea returns CRM-adjacent repos", () => {
    const { repos, matched } = searchCuratedRepos("personal crm for tracking clients and contacts");
    expect(matched).toBe(true);
    expect(repos.some((r) => /crm|contact|salesforce|customer/i.test(r.description))).toBe(true);
  });

  test("notes / second brain idea returns note-taking repos", () => {
    const { repos, matched } = searchCuratedRepos("local-first note-taking app like obsidian");
    expect(matched).toBe(true);
    expect(repos.some((r) => /note|knowledge|wiki/i.test(r.description))).toBe(true);
  });

  test("expense / budget idea returns finance repos", () => {
    const { repos, matched } = searchCuratedRepos("personal expense tracker with budgeting");
    expect(matched).toBe(true);
    expect(repos.some((r) => /budget|finance|expense/i.test(r.description))).toBe(true);
  });

  test("recipe app idea returns food-related repos", () => {
    const { repos, matched } = searchCuratedRepos("recipe manager with meal planning");
    expect(matched).toBe(true);
    expect(repos.some((r) => /recipe|meal|food|cooking/i.test(r.description))).toBe(true);
  });

  test("booking / scheduling idea returns scheduling repos", () => {
    const { repos, matched } = searchCuratedRepos("appointment booking and scheduling tool like calendly");
    expect(matched).toBe(true);
    expect(repos.some((r) => /schedul|calendar|booking|appointment/i.test(r.description))).toBe(true);
  });

  test("dashboard idea returns dashboard repos", () => {
    const { repos, matched } = searchCuratedRepos("admin dashboard with analytics and charts");
    expect(matched).toBe(true);
    expect(repos.some((r) => /dashboard|admin|analytics|chart/i.test(r.description))).toBe(true);
  });

  test("e-commerce idea returns commerce repos", () => {
    const { repos, matched } = searchCuratedRepos("online store with product catalog and checkout");
    expect(matched).toBe(true);
    expect(repos.some((r) => /commerce|shop|product|order/i.test(r.description))).toBe(true);
  });

  test("real estate / realtor idea returns property repos", () => {
    const { repos, matched } = searchCuratedRepos("crm for a realtor to track clients and listings");
    expect(matched).toBe(true);
    expect(repos.some((r) => /real.?estate|property|realtor|listing/i.test(r.description))).toBe(true);
  });

  test("inventory idea returns inventory repos", () => {
    const { repos, matched } = searchCuratedRepos("inventory management system for tracking parts and stock");
    expect(matched).toBe(true);
    expect(repos.some((r) => /inventory|stock|parts|warehouse/i.test(r.description))).toBe(true);
  });

  test("project management idea returns kanban/task repos", () => {
    const { repos, matched } = searchCuratedRepos("project tracker with issues and kanban board");
    expect(matched).toBe(true);
    expect(repos.some((r) => /project|kanban|issue|task|jira|linear/i.test(r.description))).toBe(true);
  });

  test("completely unknown idea falls back to 3 generic repos", () => {
    const { repos, matched } = searchCuratedRepos("quantum entanglement blockchain metaverse nft synergy");
    expect(matched).toBe(false);
    expect(repos.length).toBe(3);
    expect(repos.every((r) => r.license !== null)).toBe(true); // fallbacks all have licenses
  });

  test("always returns at most 3 repos", () => {
    const { repos } = searchCuratedRepos("app");
    expect(repos.length).toBeLessThanOrEqual(3);
  });

  test("returned repos have no tags field (stripped from public shape)", () => {
    const { repos } = searchCuratedRepos("job tracker");
    for (const repo of repos) {
      expect("tags" in repo).toBe(false);
    }
  });

  test("returned repos all have required NormalizedRepo fields", () => {
    const { repos } = searchCuratedRepos("crm contacts clients");
    for (const repo of repos) {
      expect(repo.id).toBeTruthy();
      expect(repo.fullName).toMatch(/\//);
      expect(repo.url).toMatch(/^https:\/\/github\.com\//);
      expect(repo.license).toBeDefined(); // may be null for AGPL entries
      expect(Array.isArray(repo.topics)).toBe(true);
      expect(repo.readme?.excerpt.length).toBeGreaterThan(10);
      expect(Array.isArray(repo.structure?.frameworks)).toBe(true);
    }
  });
});
