# Architecture

## System overview

Science10 is a static, backend-free browser application hosted from a GitHub Pages repository subpath. HTML, CSS, JavaScript modules, and JSON are served directly; there is no build output required for normal local use and no account, API, database, analytics service, or server-side progress store. MathJax is the only runtime third-party request and is loaded from jsDelivr; raw TeX remains in the content if that CDN is unavailable.

`index.html` is the canonical entry and application shell. It defines the persistent header, progress and search controls, the route view container, the Quiz dialog, MathJax configuration, and the `js/app.js` module entry. `assets/styles.css` owns responsive, state, Quiz, and Review presentation.

## Module responsibilities

- `js/app.js`: application initialization, rendering, navigation orchestration, progress summaries, search UI, Review Center UI, Quiz integration, Reset Progress, and focus/scroll behavior.
- `js/router.js`: hash parsing, canonicalization, legacy hash translation, browser-history integration, and Knowledge Point-to-Chapter lookup.
- `js/data-store.js`: cached URL-relative JSON fetches for the course index, individual Units, individual Unit Quiz sets, and search index. URLs are derived from the module location, which supports the GitHub Pages repository base path.
- `js/storage.js`: checklist, Quiz-pass, last-route storage; legacy checklist migration; pass writes; and progress reset.
- `js/review-storage.js`: schema-versioned attempt history, input sanitization, in-memory fallback when persistence is blocked, status derivation, attempt recording, and independent Review clearing.
- `js/quiz-modal.js`: on-demand Quiz loading, choice shuffling, modal/focus behavior, scoring and feedback, pass persistence, retry, and application callbacks.

## Routing and navigation

The application uses hash routing so GitHub Pages can serve every view through one physical `index.html`:

- Home: `#/`
- Unit: `#/unit/1`
- Chapter: `#/unit/1/chapter/1-1`
- Knowledge Point focus: `#/unit/1/chapter/1-1/kp/1`
- Concept focus: `#/unit/1/chapter/1-1/concept/<concept-id>`
- Review Center: `#/review`
- Full summary: `#/summary`

The hierarchy is Home -> Unit -> Chapter -> Concept -> Knowledge Point. Home renders four Unit cards and the Review entry. Unit views render four Chapter cards. Chapter views render Concepts and their KPs; routed Concepts/KPs are expanded and scrolled into view. Breadcrumbs, browser Back/Forward, saved last Chapter routes, and progress-aware Continue links preserve context.

Legacy `#unit-1`, `#chapter-1-1`, `#kp-1`, and `#full-course-summary` hashes are translated to canonical routes with `history.replaceState`. The old v2 HTML filename is a small redirect shim that preserves the hash and returns to the root entry.

## Loading boundaries and data organization

Initial application work loads the module graph and `data/course-index.json`. That small registry contains course summaries, Unit/Chapter metadata, KP ranges, and counts needed by Home and Unit navigation.

- `data/units/unit-1.json` through `unit-4.json` contain academic Unit summaries and the Chapter -> Concept -> KP hierarchy. A Unit file is fetched when its Unit or one of its Chapters is rendered.
- `data/quizzes/unit-1.json` through `unit-4.json` map KP IDs to Quiz titles and three questions. A Unit Quiz file is fetched only when a Quiz in that Unit opens, then cached.
- `data/search-index.json` is derived by `scripts/build-search-index.mjs` from the course index and Unit data. It contains Unit, Chapter, Concept, and KP routes/search text. It loads only when search is used or the Review route needs global KP/Chapter metadata.

The data model has stable Unit (`unit-1`..`unit-4`), Chapter (`chapter-1-1`..`chapter-4-4`), KP (`kp-1`..`kp-572`), and question (`kp-1-q1`..`kp-572-q3`) identities. `data/content-manifest.json` records hashes for the protected academic KP fields and summaries. `data/quiz-manifest.json` records hashes for every complete Quiz. `scripts/validate-data.mjs` checks counts, uniqueness, per-record/aggregate hashes, question structure, and KP search coverage. `scripts/validate-app.mjs` checks the expected modular files and critical routing, storage, workflow, and redirect contracts.

## Quiz gating

Clicking or pressing Enter on a KP checkbox opens its Quiz; direct checkbox toggling is prevented. Each Quiz contains three questions with four choices. `quiz-modal.js` applies Fisher-Yates-style shuffling to presentation entries while retaining each choice's original index, so scoring remains tied to `correctIndex` rather than screen position. Choices reshuffle on every open/retry.

An attempt passes only at 3/3. A pass writes both canonical checklist and Quiz-pass state, updates visible/global progress, and cannot be undone by a later non-passing practice attempt. Non-passing attempts provide question-level feedback but do not complete the KP. Every submitted attempt is offered to Review storage.

## Browser state, migration, and reset

| Key | Responsibility |
| --- | --- |
| `BCScienceConnections10_Checklist_v2` | Canonical per-KP checklist state, kept aligned with Quiz passes. |
| `BCScienceConnections10_Checklist_v1` | Legacy checklist state read during migration and removed by Reset Progress. |
| `BCScienceConnections10_QuizGate_v1` | Durable per-KP Quiz-pass state and source of completion truth. |
| `BCScienceConnections10_LastRoute_v1` | Last visited Chapter/KP route used by Continue links. |
| `BCScienceConnections10_Review_v1` | Independent Review attempt history, schema version 1. |

At initialization, `migrateLegacyProgress` treats any previously checked legacy/canonical KP as passed, aligns all 572 checklist values with Quiz-pass state, and writes canonical state. This preserves the behavior established when Quiz Gate was introduced.

Clear Review History asks for confirmation and removes only the Review key; completion and Quiz-pass state remain. Reset Progress asks for broader confirmation, removes legacy/canonical checklist and Quiz-pass keys through `storage.js`, independently clears Review history, then initializes a false canonical checklist. The last-route key is not cleared by the current implementation.

Storage failures are caught. Checklist and Quiz UI remain usable for the current page; Review storage additionally retains sanitized in-memory session state after persistence becomes blocked.

## Review Center state model

The Review value is `{ schemaVersion, updatedAt, records }`. Each valid `kp-*` record contains total/non-passing attempt counts, the last score/result/time, and first/last pass timestamps. Reads sanitize schema, IDs, timestamps, numeric ranges, and result consistency.

Display status is derived from both Review history and independent Quiz-pass state:

- `needs-practice`: the last attempt failed and the KP has not passed.
- `review-recommended`: the last attempt failed but the KP remains passed from an earlier attempt.
- `recently-passed`: the last attempt passed after at least one non-passing attempt.

A first-attempt pass remains stored but produces no Review row. Review filters cover Unit, Chapter, and status; sorting covers recommendation priority, recent activity, course order, and attempts. Review metadata comes from the search index, not Unit files. Practice Quizzes load only the relevant Unit Quiz file.

## Privacy model

Checklist completion, Quiz passes, last route, and Review history remain in the current browser's `localStorage`; Review can fall back to memory for the session. No state is transmitted to the repository, GitHub Pages, an account, or an analytics endpoint. State does not sync across browsers, devices, profiles, or private sessions. Clearing site data removes it.

## Playwright and delivery flow

`playwright.config.js` runs `tests/e2e/` against a Python static server on `127.0.0.1:4173`, uses fresh browser contexts, is headless, and retains failure artifacts. CI uses one worker, one retry, GitHub/line reporting, and Chromium. A shared fixture records browser console errors, page errors, failed local requests, and local HTTP errors as soft test failures.

The 50-test baseline covers the application shell and boundaries, hash/history routes, search, Quiz behavior, Review tracking and UI, Reset/Clear semantics, lazy loading, responsive widths, touch targets, focus, accessible names, and MathJax. It does not currently exercise Firefox/WebKit or the published `/Science10-checklist/` base path.

On `codex/**`, `main`, and pull requests to `main`, `.github/workflows/qa.yml` installs dependencies/Chromium, validates, and runs E2E. A push to `main` also runs `.github/workflows/pages.yml`; only after the same checks pass does it copy the allowlisted static site into `public/` and publish an orphan `gh-pages` commit. Repository Pages settings are expected to serve `gh-pages` root.

## Safe extension points

- Add a new view by extending `router.js`, rendering/binding in `app.js`, and adding route/history/accessibility tests without changing existing canonical routes.
- Add UI behavior in a focused module and keep `index.html` as a small shell.
- Add Review schema fields only through a versioned, sanitizing migration that preserves old state and reset/clear independence.
- Add derived search fields by changing the generator and regenerating the index; never create a second hand-maintained source.
- Add academic or Quiz content only through an explicitly approved content workflow that preserves IDs, updates the appropriate manifest deliberately, rebuilds search when needed, and includes human review.
- Add production smoke coverage with base-path-aware navigation and a separate deployed-artifact/URL configuration; keep local regression deterministic.
