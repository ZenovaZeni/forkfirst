# Demo Prompts

Use these prompts when recording a demo, testing a release, or showing ForkFirst to builders.

## First Run

```text
I want to build a local-first app that checks whether my product idea already exists on GitHub and finds the best repo to fork or study.
```

Shows the default empty-state path: prompt refinement, GitHub query planning, ranked repo leads, verdict, report export, and Build Pack handoff.

## Open Source Alternatives

```text
Find repos like Cursor, but open source and useful as a starting point
```

Shows prompt refinement, repo comparison, and fork/reference labeling.

## Business Tools

```text
Find open-source AI lead generation tools for small business owners
```

Shows non-developer business use cases and why GitHub search alone is not enough.

## Existing Product Check

```text
Is there an open-source version of Clay or Instantly that I can fork or learn from?
```

Shows competitor discovery and opportunity-gap language.

## Voice Assistant

```text
Find repos that help me build a Whisper-like voice assistant
```

Shows focused search terms, speech/Whisper repo matching, and useful follow-up questions.

## Game Engine

```text
What game engines or starter repos are good for a 2.5D game?
```

Shows the planner looking for Godot, Bevy, Phaser, Defold, and isometric game-engine angles.

## Build Pack Demo

After results appear, choose `Codex` or `Claude Code` in the Build Pack section and click `Generate`.

This demonstrates the handoff from repo research to AI-assisted project planning.

## Export Report Demo

After results appear, save one or two repos into boards, then click `Export report`.

The report should include:

- Executive summary and verdict.
- Recommended next moves.
- Prompt refinement and GitHub queries.
- Top repo snapshots with score, license, activity, and fit signals.
- Warnings, opportunity gaps, and saved repo boards.

## Release Smoke Pass

Before recording or publishing, run one prompt without keys and one prompt with BYOK configured. Confirm that the no-key run stays usable, warnings are understandable, saved repos persist in the browser, Build Pack opens, and Markdown export downloads.
