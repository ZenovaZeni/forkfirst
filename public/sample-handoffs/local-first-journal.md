# ForkFirst Sample Handoff: Local-First Journal

## Idea

Build a private browser journal/notes app that stores entries locally, supports tags, fast search, daily prompts, and optional Markdown export.

## Repos Found

Sample generated from live GitHub Search API results checked on 2026-05-17. Re-check license and repo health before reuse.

1. `massCodeIO/massCode` - local-first developer workspace with snippets, notes, requests, and dev utilities. Strong TypeScript app reference; AGPL-3.0 license requires careful review.
2. `pbek/QOwnNotes` - mature Markdown/plain-text note app with sync integrations. Strong product reference, but C++/Qt may not be the right starter stack for a browser app.
3. `TriliumNext/Notes` - personal knowledge base in TypeScript. Useful for hierarchy/search concepts; AGPL-3.0 license requires careful review.

## Selected Starter Repo

`massCodeIO/massCode`

```bash
git clone https://github.com/massCodeIO/massCode.git private-journal
cd private-journal
npm install
npm run dev
```

## Builder Direction

Use the starter as an architecture and interaction reference, not a license-cleared code source. Adapt the information architecture for a calm journal workflow: Today, Timeline, Tags, Search, Export.

## Product Requirements

- Create and edit Markdown entries.
- Store everything locally by default, with a clear privacy model before any sync.
- Add tags and mood/energy fields.
- Search entry title and body.
- Show daily writing prompt suggestions.
- Export entries as Markdown files or one zipped archive.

## Brand

Warm, private, low-pressure. Avoid social or productivity language. The user should feel like the app is a quiet notebook.

## Builder Instructions

- Confirm data never leaves the local app in the default path.
- Keep the storage layer simple and inspectable.
- Add an explicit export path before adding sync.
- Do not add AI analysis until the privacy model is explicit.

## First Milestone

User can write an entry, tag it, find it later, and export it as Markdown.
