# ForkFirst Sample Handoff: Job Application Tracker

## Idea

Build a local-first job application tracker for solo job seekers who want a fast Kanban-style workflow, notes, follow-ups, CSV export, and no account requirement.

## Repos Found

Sample generated from live GitHub Search API results checked on 2026-05-17. Re-check license and repo health before reuse.

1. `ganainy/VibeHired-ai` - AI-powered job application tracker with Kanban, resume/cover-letter workflows, React/Node/Gemini stack, and public demo link. License metadata is `NOASSERTION`, so inspect the repo before reuse.
2. `berkinduz/job-apply-tracker` - focused Next.js/Supabase job application tracker with job-search topics and Kanban language. License metadata was not present in GitHub search results.
3. `Abhiz2411/Job-tracker-application` - smaller Kanban-style job tracker reference. Useful for UI comparison, but inspect freshness and license first.

## Selected Starter Repo

`ganainy/VibeHired-ai`

```bash
git clone https://github.com/ganainy/VibeHired-ai.git job-tracker-fork
cd job-tracker-fork
npm install
npm run dev
```

## Builder Direction

Use the starter repo as the product foundation only after license/setup inspection. Keep the job-search domain model, Kanban flow, resume/cover-letter touchpoints, and useful parsing ideas. Simplify the first build toward a trustworthy tracker: companies, roles, contacts, interview stages, follow-up dates, compensation notes, links, and outcome.

## Product Requirements

- Local-first by default, no signup for version one.
- Add applications with company, role, link, location, salary range, contact, source, and notes.
- Move applications through stages: Saved, Applied, Screening, Interview, Offer, Rejected, Archived.
- Add follow-up reminders as visible dates, not background notifications.
- Export and import CSV.
- Search and filter by stage, company, role, and date.

## Brand

Quiet, focused, confidence-building. Make the product feel like a clean personal CRM, not a recruiting dashboard.

## Builder Instructions

- First inspect the repo structure and identify the board/card/local-storage implementation.
- Keep the smallest working path intact before restyling.
- Add tests around CSV import/export and stage movement.
- Do not add auth, billing, or a database in the first milestone.

## First Milestone

User can add a job, move it across stages, add a follow-up date, search it, and export the board to CSV.
