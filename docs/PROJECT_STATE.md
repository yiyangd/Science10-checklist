# Project state

## Verified snapshot

As of 2026-07-16 (America/Vancouver), the repository-backed baseline is:

| Item | Verified value |
| --- | --- |
| Production URL | https://yiyangd.github.io/Science10-checklist/ |
| `main` | `9635c4407d0d46cfccea5a2405b20836db1655d8` |
| `origin/main` | `9635c4407d0d46cfccea5a2405b20836db1655d8` (0 ahead, 0 behind after fetch) |
| Deployed `origin/gh-pages` | `ed703241db32f45eba6aa16af1fd58e48d3b2893` |
| Deployment source recorded by that commit | `9635c4407d0d46cfccea5a2405b20836db1655d8` |
| Units / Chapters | 4 / 16 |
| Knowledge Points / Quizzes | 572 / 572 |
| Quiz questions / search entries | 1716 / 711 |
| Academic aggregate SHA-256 | `5e5e1b2c20c4fa1ef96dd773e8229f36e3ab9e7f65aa6511cc8eaf98b374c486` |
| Quiz aggregate SHA-256 | `a1e0e5c3abab00e99c819fdbc6e477d7c846cda633b39324fd477678c9d766ac` |
| Static validation | `npm.cmd run validate` passes |
| Local Playwright baseline | 50 passed, Chromium |

The aggregate hashes are enforced by `scripts/validate-data.mjs`; both manifests identify `aef7f31fb3cdc1f3262fc99262af06ea429074b1` as their content source commit. The production root returned HTTP 200 and the expected modular shell on 2026-07-16. This is an availability/shell probe, not a complete production regression run.

## Current application status

The application is a backend-free static site. It provides hierarchical Home, Unit, Chapter, Knowledge Point, full-summary, and Review routes; global search; quiz-gated completion; randomized answer order; browser-local progress; Review filtering/sorting; legacy route migration; and confirmed Reset/Clear behaviors. Unit, Quiz, and search data are lazy-loaded at their documented boundaries.

The current automated suite exercises routing, Unit boundaries, search, Quiz gating and persistence, Review storage and Review Center behavior, responsive layouts at four widths, keyboard/focus behavior, key accessible names, MathJax rendering, and local runtime/network errors. It runs only Chromium.

## Deployment method

`.github/workflows/pages.yml` runs on pushes to `main` and manual dispatch. It uses Node 20, runs `npm ci`, installs Playwright Chromium with system dependencies, runs static validation and all E2E tests, copies an explicit static-file set into `public/`, and force-publishes that directory as an orphan `gh-pages` history with `peaceiris/actions-gh-pages@v4`.

The repository README says GitHub Pages should be configured for `gh-pages` at the repository root. The effective Pages setting is external repository state and was not independently read during this snapshot; the live URL and deployed branch are consistent with it.

`.github/workflows/qa.yml` runs the same validation and Chromium E2E sequence on pushes to `main` and `codex/**`, pull requests targeting `main`, and manual dispatch. It has read-only contents permission and does not publish.

## Active and retained branches

- `codex/project-operations-baseline`: Stage 30A documentation branch, reconciled in Stage 30D after the Stage 30B/30C legacy-stash work and based on the verified `main` SHA above.
- `origin/codex/e2e-regression-suite` at `8e591de2c5e04c552f3dec7a080d80936c078989`: merged into `main`, retained remotely.
- `origin/codex/review-tracking-foundation` at `440894000edc0fb345c8919c077bb07d9b675438`: merged into `main`, retained remotely.
- Local `codex/hierarchical-navigation-refactor` at `260c481fdd868c3a3764a5570e4e972a60b9bb2d`: merged into `main`; no matching remote branch was present at verification.
- The local `gh-pages` branch is at `a485fcc887b420091659f16b420040db8ede1d70` and is 3 commits ahead/1 behind `origin/gh-pages`. It is stale local state and must not be used, cleaned, or pushed as part of ordinary feature work.

## Completed legacy-stash disposition

Stage 30B audited stash commit `1fcca65d9b410ff9e78c88f3f4b3b0b836604cdf`, described as `On main: WIP Unit 3 distractor edits before Chapter 1.3 audit`. Ten of its 11 changes only reordered choices. Its only substantive wording change had been superseded by a stronger committed rewrite, so the audit found no unique Quiz-quality improvement that required extraction.

Stage 30C then removed that exact audited stash. No unrelated stashes existed, and the branch, `HEAD`, index, and working tree remained unchanged and clean. Stage 30D reconfirmed that the stash list is empty before reconciling this documentation.

## Known issues and verification gaps

1. **Pending `kp-306-q3` human review.** The Stage 30B audit identified a possible mismatch between the current correct choice and the opening wording of the explanation. Later normal Git history, not the deleted stash, introduced the present wording. This has not received human academic/Quiz review and must be assessed in a separately authorized Quiz-content task; Stage 30D does not change the question, choices, answer, explanation, ID, or manifests.
2. **Production/base-path Playwright gap.** Tests default to `http://127.0.0.1:4173`, navigate with root-relative URLs such as `/` and `/data/...`, and run before publication. No workflow tests the deployed `/Science10-checklist/` subpath or the live `gh-pages` output. `E2E_BASE_URL` exists, but the present navigation helpers and `webServer` configuration are not a production-subpath test design.
3. **Browser coverage.** Playwright installs and runs Chromium only; Firefox, WebKit, and real mobile browsers are unverified.
4. **Accessibility coverage.** Tests cover targeted names, focus behavior, touch sizes, and overflow. There is no general automated accessibility scanner and no recorded full manual audit.
5. **Content assurance.** Hashes prove the approved data did not change; they do not prove textbook fidelity or pedagogical quality. Textbook source mapping and human academic/Quiz review remain incomplete.
6. **Repository settings.** Branch protection, required checks, Pages settings, and release traceability are not expressed in repository files and were not verified as external settings in this snapshot.

The GitHub CLI was not installed in the Stage 30A or Stage 30D workstation environment. Repository refs were verified with `git`, production with an HTTP probe, and branch workflow state can be checked through the authenticated GitHub connector. This is an environment limitation, not an application defect.

## Next recommended stages

1. **Stage 30E: merge the documentation baseline.** Review and merge the reconciled documentation branch only after its release-candidate validation, 50-test E2E run, unchanged content hashes, and feature-branch Browser regression QA are confirmed; do not combine protected content or deployment changes with the merge.
2. **Human-reviewed canonical data and Quiz-quality validation.** Define evidence and review criteria beyond hash equality, begin by assessing the possible `kp-306-q3` answer/explanation alignment issue, and change protected Quiz content only in small, separately authorized batches.
3. **Production/base-path-aware smoke testing.** Test the actual published subpath and deployment artifact without weakening the existing local suite.
4. **Branch protection and release traceability.** Make required QA and source-to-deployment evidence explicit in repository settings and release operations.
5. Continue with cross-browser, accessibility, and textbook-mapping work described in [ROADMAP.md](ROADMAP.md).

## Explicit uncertainties

- Repository history proves what changed but does not consistently record why an alternative was rejected. `docs/DECISIONS.md` labels those entries as reconstructed and leaves unsupported rationale unclaimed.
- The correct academic interpretation and any appropriate remedy for the possible `kp-306-q3` answer/explanation mismatch remain unknown pending qualified human review; the audit finding alone is not academic validation.
- The production probe did not validate every route, asset, Quiz, localStorage behavior, or CDN-dependent MathJax rendering at the GitHub Pages base path.
