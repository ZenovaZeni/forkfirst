# Build Pack IR Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a typed Build Pack intermediate representation with explicit repo-to-product alignment decisions before Markdown generation.

**Architecture:** Keep the existing `HandoffBlueprint` domain engine, then wrap it in a `BuildPackIR` object that captures product intent, selected repo evidence, alignment decisions, first milestone, risk notes, and verification requirements. The generator should consume this IR for the adaptation map, coverage map, reuse matrix, phase plan, and key PRD fields without changing the public `buildProjectBuildPack()` API.

**Tech Stack:** TypeScript, Vitest, existing ForkFirst scoring/search/build-pack modules.

---

### Task 1: IR Builder Contract

**Files:**
- Create: `src/lib/build-pack/ir.ts`
- Test: `src/lib/build-pack/ir.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that call `buildBuildPackIR()` with a card-collector idea and a repo containing card search, collection, value, export, and setup evidence. Assert:

- `ir.product.kind` is `card-collector`
- `ir.alignment.decisions` contains `keep`, `replace`, `add`, `remove`, and `inspect`
- keep decisions include repo evidence
- add decisions include product requirements missing from repo evidence
- no decision uses placeholder labels like `PrimaryItem` or `UserInput`

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/build-pack/ir.test.ts
```

Expected: fail because `src/lib/build-pack/ir.ts` does not exist.

- [ ] **Step 3: Implement minimal IR builder**

Create `BuildPackIR` types and a `buildBuildPackIR()` function that:

- reuses `buildHandoffBlueprint()`
- normalizes selected/candidate repos
- builds alignment decisions from blueprint workflow, data objects, user actions, repo evidence, and preferences
- exposes compatibility helpers for generator sections

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/build-pack/ir.test.ts
```

Expected: pass.

### Task 2: Generator Integration

**Files:**
- Modify: `src/lib/build-pack/generator.ts`
- Test: `src/lib/build-pack/generator.test.ts`

- [ ] **Step 1: Write failing generator tests**

Add tests proving generated Markdown includes:

- `## Alignment Decisions`
- table rows for Keep, Replace, Add, Remove, Inspect
- domain-specific card collector evidence
- no generic `PrimaryItem` / `UserInput` leakage for supported domains

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts
```

Expected: fail because generator has no `Alignment Decisions` section yet.

- [ ] **Step 3: Wire generator to IR**

Inside `buildProjectBuildPack()`:

- build the IR after repo sanitization and project name/preference extraction
- use `ir.blueprint`, `ir.profile`, `ir.alignment` instead of recomputing local blueprint/profile values
- insert an `## Alignment Decisions` table after `## Repo-To-Product Adaptation Map`
- make `foundationCoverageMap()`, `reuseMatrixLines()`, and `phasePlan()` consume IR-derived fields where helpful

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/build-pack/ir.test.ts src/lib/build-pack/generator.test.ts src/lib/launch-evals/launch-evals.test.ts
```

Expected: all pass.

### Task 3: Full Verification And Launch Gate

**Files:**
- Package/docs only if the command list changes.

- [ ] **Step 1: Run targeted launch evals**

Run:

```bash
npm run test:launch-evals
```

Expected: pass.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit and push**

Commit message:

```bash
git commit -m "Add Build Pack IR alignment map"
```

