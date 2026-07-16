# Decisions

This is a lightweight, append-only decision log. Add a new entry when a decision changes; do not rewrite history. **Reconstructed** means the change is supported by repository files and commits, but no contemporaneous decision record exists. Unrecorded rationale or rejected alternatives remain explicitly unknown.

## 2026-07-05 - Static GitHub Pages application

- **Status:** Accepted; Reconstructed.
- **Context:** The initial repository package contains static HTML/Markdown and `.nojekyll`, with no backend or server application.
- **Decision:** Deliver the checklist as static browser assets on GitHub Pages.
- **Alternatives:** No backend alternative or evaluation is recorded.
- **Consequences:** Hosting and local serving are simple; browser features must work without server state, and JSON requires HTTP locally.
- **Related commit:** `047dc11` (`Publish GitHub Pages checklist package`).

## 2026-07-05 - `index.html` is the canonical entry

- **Status:** Accepted; Reconstructed.
- **Context:** The first root entry redirected to a long v2 filename. The next commits moved the app to the root and converted the old filename to a hash-preserving redirect.
- **Decision:** Serve the application from `index.html`; retain the v2 URL only as a compatibility shim.
- **Alternatives:** The prior canonical-v2-file/redirecting-root arrangement is visible in history and was replaced.
- **Consequences:** Production has a clean root URL while old bookmarks continue to resolve.
- **Related commits:** `4accb98`, `ff53f25`.

## 2026-07-05 - Quiz-gated completion

- **Status:** Accepted; Reconstructed.
- **Context:** Direct checklist completion preceded the Quiz pilot. The pilot added three-question Quizzes and a separate pass key.
- **Decision:** A KP becomes complete only after all three Quiz questions are correct; completed KPs may be retried for practice without losing completion.
- **Alternatives:** Direct checkbox completion was the previous implementation. Other pass thresholds are not evaluated in the record.
- **Consequences:** Completion represents a perfect Quiz attempt; Quiz structure and pass-state compatibility are stable contracts.
- **Related commit:** `f700e13` (`Add quiz-gated checklist pilot`).

## 2026-07-05 - Browser-local progress

- **Status:** Accepted; Reconstructed.
- **Context:** The initial application and README store checklist state with `localStorage`; Quiz Gate added a second local key.
- **Decision:** Keep student checklist and Quiz-pass state in the visitor's browser with no account or synchronization service.
- **Alternatives:** No account, backend, or cross-device design is recorded.
- **Consequences:** Use is private and backend-free, but state is device/profile-specific and can be removed with browser data.
- **Related commits:** `047dc11`, `f700e13`.

## 2026-07-06 - Deploy through an orphan `gh-pages` branch

- **Status:** Accepted; Reconstructed.
- **Context:** Earlier workflow iterations used the GitHub Pages artifact/deployment actions. The repository switched to publishing an explicit `public/` allowlist with `peaceiris/actions-gh-pages`.
- **Decision:** Validate on `main`, then force-publish the static allowlist to an orphan `gh-pages` branch served from its root.
- **Alternatives:** The earlier Pages artifact and `actions/deploy-pages` workflow is preserved in the parent history and was replaced; the reason is not recorded in a decision note.
- **Consequences:** The deployment commit records its source SHA and excludes local-only files; `gh-pages` is generated state and must not be edited manually.
- **Related commit:** `69d1de6` (`Switch Pages deployment to gh-pages branch`).

## 2026-07-07 - Randomize Quiz choice presentation

- **Status:** Accepted; Reconstructed.
- **Context:** Quiz choices were originally rendered in stored order.
- **Decision:** Shuffle choices whenever a Quiz is opened or retried while score calculation retains canonical answer indices.
- **Alternatives:** Fixed stored order was the previous behavior.
- **Consequences:** Tests and implementation must never assume that the correct answer appears at a fixed visual position.
- **Related commit:** `e3e6b63` (`Randomize quiz answer choice order`).

## 2026-07-11 - Split Unit, Quiz, and derived search data

- **Status:** Accepted; Reconstructed.
- **Context:** The application was a monolithic HTML file with a single `quiz-data.js` bundle. The hierarchical refactor introduced JSON registries, four Unit files, four Quiz files, search data, manifests, and validators.
- **Decision:** Keep the course registry small; split academic and Quiz runtime data by Unit; derive global search data; protect content with manifests.
- **Alternatives:** The prior monolithic HTML and Quiz bundle were removed. Other split granularities are not evaluated in the record.
- **Consequences:** Initial payload and on-demand boundaries improve, but cross-file IDs, derived search output, and manifests must remain synchronized.
- **Related commit:** `87a5a63` (`Refactor checklist into hierarchical learning app`).

## 2026-07-11 - Hierarchical hash navigation

- **Status:** Accepted; Reconstructed.
- **Context:** The monolithic checklist displayed the full course. The refactor introduced Home, Unit, Chapter, Concept/KP focus, breadcrumbs, and canonical hash routes with legacy translations.
- **Decision:** Render one learning level at a time and use GitHub Pages-safe hash routes for shareable/history-aware navigation.
- **Alternatives:** The previous full-document/collapsible hierarchy was replaced.
- **Consequences:** Unit and Chapter data can load on demand; old hashes require permanent migration support; route behavior is regression-tested.
- **Related commits:** `87a5a63`, `260c481`.

## 2026-07-11 - Playwright browser regression testing

- **Status:** Accepted; Reconstructed.
- **Context:** The repository added Playwright configuration, shared fixtures, browser specs, and a feature-branch QA workflow; deployment was changed to run the suite before publication.
- **Decision:** Use automated Chromium E2E regression tests locally, on `codex/**`, on pull requests to `main`, and before `gh-pages` publication.
- **Alternatives:** Static validators alone were the previous automated check. Other browser engines were not added.
- **Consequences:** User-visible flows and runtime errors block deployment, but production-subpath and cross-browser gaps remain.
- **Related commit:** `8e591de` (`Add automated browser regression suite`).

## 2026-07-11 - Review history is independent of completion

- **Status:** Accepted; Reconstructed.
- **Context:** Review tracking was added after Quiz-pass storage. It received its own schema/key, sanitization, and clear control; later commits added the Review Center and privacy/reset behavior.
- **Decision:** Store submitted-attempt history separately from checklist/Quiz passes. Clearing Review history preserves completion; a later failed practice attempt recommends review without revoking a prior pass.
- **Alternatives:** Reusing completion storage or revoking passes is not implemented; no formal alternative analysis is recorded.
- **Consequences:** Reset and Clear have intentionally different scopes, status is derived from two stores, and migrations must preserve that independence.
- **Related commits:** `b160c42`, `07c3ddf`, `9c2fe8b`.
