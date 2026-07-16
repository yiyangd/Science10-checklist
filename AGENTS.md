# Science10 repository guidance

This file applies to the entire repository. Detailed project facts live in `docs/`; keep this file short and operational.

## Purpose and sources of truth

Science10 is a static, backend-free BC Science Connections 10 checklist with quiz-gated completion and browser-local review history. Treat the current repository in this order of authority:

1. Versioned application and data files, especially `data/` and its manifests.
2. Validation scripts, Playwright tests, and GitHub Actions workflows.
3. `README.md` and `docs/`.
4. Git history for historical reconstruction. Label reconstructed conclusions; do not invent missing rationale.

Historical chat is not an authoritative source. Resolve conflicts by checking the repository and record any remaining uncertainty.

## Important paths

- `index.html`, `assets/`, `js/`: static application shell, styling, routing, storage, data loading, Quiz UI, and Review Center.
- `data/course-index.json`, `data/units/`, `data/quizzes/`: canonical runtime course and Quiz data.
- `data/content-manifest.json`, `data/quiz-manifest.json`: academic and Quiz integrity baselines.
- `data/search-index.json`: derived search and Review metadata; regenerate with `npm.cmd run build-search` after an approved Unit-data change.
- `scripts/`: search-index generation and static validation.
- `tests/e2e/`, `playwright.config.js`: browser regression suite.
- `.github/workflows/qa.yml`: feature-branch and pull-request QA.
- `.github/workflows/pages.yml`: validation and `gh-pages` publication from `main`.
- `docs/`: current state, architecture, decisions, and roadmap.

## Windows commands

From the repository root:

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run validate
npm.cmd run test:e2e
npm.cmd run serve
```

The local server is `http://127.0.0.1:8765/`. Use HTTP because the application fetches JSON; do not open `index.html` through `file://`.

## Stable invariants and protected content

- Preserve 4 Units, 16 Chapters, 572 unique Knowledge Points, 572 Quizzes, 1716 questions, and the current contiguous `kp-1` through `kp-572` identity unless a task explicitly authorizes a schema/content migration.
- Unit, Chapter, Concept, KP, Quiz-question IDs, routes, and cross-file mappings are stable interfaces. Never renumber or silently reuse them.
- Academic fields, summaries, study guidance, Quiz prompts, choices, answers, explanations, and integrity manifests are protected content. Change them only under an explicit academic or Quiz-content task with human-review expectations.
- Every Quiz has exactly 3 questions; every question has 4 choices, one valid `correctIndex`, and an explanation. Passing requires 3/3.
- Do not recalculate a manifest merely to silence a validation failure. Explain and review the underlying content change first.
- `data/search-index.json` is derived from `data/course-index.json` and `data/units/`. Do not hand-edit it. Rebuild and commit it with its approved source change.

## Browser-storage compatibility

Preserve these keys and meanings:

- `BCScienceConnections10_Checklist_v2`: canonical checklist state.
- `BCScienceConnections10_Checklist_v1`: legacy checklist input used by migration.
- `BCScienceConnections10_QuizGate_v1`: Quiz-pass state.
- `BCScienceConnections10_LastRoute_v1`: last Chapter route.
- `BCScienceConnections10_Review_v1`: independent, schema-versioned Review history.

Existing checked legacy KPs migrate to passed state. Clear Review History must not clear checklist or Quiz-pass state. Reset Progress requires confirmation and clears checklist, Quiz-pass, legacy checklist, and Review state; it does not require a backend.

## Branches, checks, and deployment

- Work on a focused `codex/<task>` feature branch. Do not work directly on `main` or `gh-pages`.
- Before editing, fetch and confirm the intended base, a clean/understood worktree, and no unexpected divergence.
- Never apply, pop, drop, rename, or otherwise manipulate an unrelated stash. Read-only stash inspection requires an explicit task.
- Documentation-only changes: verify paths, commands, links, SHAs, counts, storage keys, and workflow claims. Run validation and E2E when the documentation records or changes the project baseline.
- Application, routing, storage, or CSS changes: run `npm.cmd run validate` and the complete E2E suite; add focused regression coverage.
- Data or Quiz changes: preserve IDs, rebuild search data when Unit data changes, run all validation and E2E, review both aggregate hashes, and require appropriate human academic review.
- Workflow or deployment changes: inspect permissions, triggers, concurrency, published-file allowlist, and run local validation/E2E. Do not trigger a production deployment without explicit authorization.
- Pushing `main` starts validation, E2E, and publication to `gh-pages`. Never merge, push `main`, edit `gh-pages`, deploy, tag, or change Pages settings unless the task explicitly authorizes it.
- Feature branches matching `codex/**` run Browser regression QA but do not deploy.

## Files that must not be committed

Never commit `Science10.pdf`, the v1 interactive HTML file, `.vs/`, `node_modules/`, `playwright-report/`, `test-results/`, `blob-report/`, screenshots, traces, videos, browser binaries, or other generated test output. Check `git status --ignored` if uncertain.

## Documentation, handoffs, and done

- Keep `README.md` concise; update `docs/PROJECT_STATE.md` for a new verified baseline and append evidence-backed decisions to `docs/DECISIONS.md`.
- A handoff must name the branch and commit, changed files, commands and results, content-integrity hashes, workflow status/URL, unresolved risks, and any unverified claim.
- A change is done only when scope is respected, relevant checks pass, protected content and storage compatibility are preserved or explicitly migrated, the complete diff contains no unrelated/generated files, documentation is current, and deployment actions match the authorization given.

Subagents may inspect read-only evidence or work on clearly disjoint files when explicitly authorized. Give them narrow scope, prohibit stash/deployment operations, and require evidence in their handoff. The primary agent must reconcile their work, inspect the final diff, and run the authoritative checks; never let concurrent agents edit the same content or infer historical rationale.
