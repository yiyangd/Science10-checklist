# Roadmap

The roadmap describes intended outcomes, not authorization to change protected content, repository settings, or production. Re-prioritize with evidence and record completed baselines in `PROJECT_STATE.md`.

## Now

### Durable project documentation baseline

- **Outcome:** Future work can reconstruct the application, operations, constraints, and verified baseline from the repository instead of chat history.
- **Success criteria:** `AGENTS.md` and the four `docs/` files are concise, cross-linked, repository-verified, and shipped from a documentation-only branch whose static validation, 50 E2E tests, content hashes, and branch QA pass.
- **Dependencies:** Stable `main`, readable history, current validation/tests/workflows, and a clean feature branch.
- **Major risks:** Copying stale facts, presenting inferred rationale as fact, or allowing the README to become a ledger.
- **Non-goals:** Application, workflow, academic/Quiz content, ID, storage, deployment, or stash changes.

## Next

### Read-only July 8 legacy-stash audit

- **Outcome:** The retained WIP is understood well enough to decide whether any ideas deserve a separately authorized content-review stage.
- **Success criteria:** Report the stash base, indexed/working/untracked components, affected KPs/questions, overlap with current `main`, content/hash implications, and keep/drop recommendations without changing refs, files, index, or stash state.
- **Dependencies:** Clean worktree and exact read-only Git commands against `stash@{0}`.
- **Major risks:** Accidentally applying or deleting the stash; mistaking superseded distractors for current approved work.
- **Non-goals:** Applying, popping, branching from, renaming, dropping, committing, or editing the stash.

### Canonical data and Quiz-quality validation

- **Outcome:** Students receive academically faithful KPs and useful, plausible Quiz questions in addition to byte-level integrity.
- **Success criteria:** Define canonical evidence, validate ID/mapping/schema rules, identify weak or ambiguous questions in traceable batches, require human academic sign-off, and update content/manifests only through approved changes with unchanged unrelated hashes.
- **Dependencies:** Textbook/source access, reviewer criteria, manifest-update procedure, and the stash audit where relevant.
- **Major risks:** Copyright mishandling, unsourced corrections, answer ambiguity, mass hash churn, ID drift, and automated checks being mistaken for academic review.
- **Non-goals:** Renumbering stable IDs, broad rewriting for style alone, or regenerating manifests to hide failures.

### Production/base-path-aware smoke testing

- **Outcome:** The deployed GitHub Pages subpath is checked as students actually load it.
- **Success criteria:** Add a separate smoke mode that preserves `/Science10-checklist/`, verifies the deployed static allowlist and representative Home/Unit/Chapter/KP/Review/legacy routes, reports the tested source/deployment SHAs, and cannot deploy or mutate student state outside an isolated browser context.
- **Dependencies:** Base-path-safe helpers/configuration, stable production URL, and a way to associate `main` with the generated `gh-pages` commit.
- **Major risks:** Root-relative tests passing locally but bypassing the repository subpath, CDN/cache flakiness, or tests accidentally targeting the wrong deployment.
- **Non-goals:** Replacing the deterministic local 50-test suite or running all 572 Quizzes against production.

### Branch protection and release traceability

- **Outcome:** Only reviewed, passing changes reach `main`, and every production state can be traced to its reviewed source.
- **Success criteria:** Require Browser regression QA for `main`, prevent direct/unreviewed pushes as appropriate, document emergency procedure, retain source SHA in deployment evidence, and verify Pages branch/root settings.
- **Dependencies:** Repository-admin access, agreed reviewer policy, stable workflow names, and production smoke evidence.
- **Major risks:** Locking out maintainers, bypass paths, branch-name/check-name drift, or treating a generated `gh-pages` commit as source.
- **Non-goals:** Deleting retained branches or rewriting existing history as part of setup.

## Later

### Cross-browser testing

- **Outcome:** Core learning and Quiz flows work consistently beyond Chromium.
- **Success criteria:** Run a risk-based subset in Firefox and WebKit, cover desktop/mobile viewports, publish engine-specific failures, and define supported browser versions.
- **Dependencies:** Production-safe tests, CI capacity, and deterministic MathJax handling.
- **Major risks:** Runtime/cost growth, flaky rendering differences, and unsupported browser expectations.
- **Non-goals:** Exhaustive device coverage or visual pixel parity.

### Accessibility automation and manual review

- **Outcome:** Keyboard, screen-reader, zoom, contrast, reflow, and feedback experiences support a wider range of students.
- **Success criteria:** Add an automated scanner with reviewed exceptions; perform documented keyboard and screen-reader checks on all primary views; verify 200%/400% zoom, contrast, reduced motion, error messaging, and Quiz/Review focus transitions; triage findings by student impact.
- **Dependencies:** Stable UI, named accessibility standard/target, assistive-technology test matrix, and human reviewers.
- **Major risks:** Treating automated scans as complete, false positives, and regressions caused by dynamic MathJax/modal content.
- **Non-goals:** Claiming conformance from automation alone.

### Textbook source mapping and human content review

- **Outcome:** Each KP and Quiz can be reviewed against an authorized source and pedagogical intent.
- **Success criteria:** Map records to permitted source locations without copying protected text unnecessarily; record reviewer/date/status; resolve discrepancies in small batches; preserve evidence and unrelated hashes; separate factual review from writing-style preference.
- **Dependencies:** Lawful textbook access, citation/storage policy, subject-matter reviewers, and canonical validation rules.
- **Major risks:** Copyright exposure, reviewer inconsistency, overconfident automated interpretation, and large unreviewable diffs.
- **Non-goals:** Publishing the textbook, embedding page scans, or replacing qualified human judgment with generated content.
