# BC Science Connections 10 Knowledge Point Checklist

This repository contains a hierarchical, quiz-gated learning checklist for the BC Science Connections 10 course. It is a static application designed for GitHub Pages and does not require a backend or build step.

## Learning Flow

The application uses three focused levels instead of rendering the full course at once:

1. Home shows four Unit cards with progress.
2. A Unit view shows its four Chapter cards.
3. A Chapter view shows its Concepts and Knowledge Points.

The course contains 4 Units, 16 Chapters, 572 Knowledge Points, and 1716 multiple-choice questions. Every Knowledge Point requires passing its three-question Quiz before completion is saved.

## Project Structure

- `index.html` - small application shell and canonical GitHub Pages entry point
- `assets/styles.css` - responsive application and Quiz styles
- `js/` - routing, storage, data loading, Quiz modal, and view rendering modules
- `data/course-index.json` - small Home and Unit navigation registry
- `data/units/` - academic checklist content split by Unit
- `data/quizzes/` - Quiz data split by Unit and loaded on demand
- `data/search-index.json` - global search data loaded only when search is used
- `data/content-manifest.json` - SHA-256 baseline for all 572 academic records
- `data/quiz-manifest.json` - SHA-256 baseline for all 572 Quizzes
- `scripts/validate-data.mjs` - academic and Quiz integrity validation
- `scripts/validate-app.mjs` - application structure and deployment validation
- `BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist.md` - source Markdown checklist
- `BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist_Interactive_v2.html` - old-URL redirect shim
- `.nojekyll` - disables Jekyll processing

## Local Use

The application loads JSON data with `fetch`, so serve the repository over HTTP rather than opening `index.html` with a `file://` URL.

```powershell
npm.cmd run serve
```

Then open `http://127.0.0.1:8765/`.

Run all static integrity checks with:

```powershell
npm.cmd run validate
```

## Automated QA

Install dependencies and the Playwright Chromium browser once:

```powershell
npm.cmd install
npx.cmd playwright install chromium
```

Run the browser regression suite:

```powershell
npm.cmd run test:e2e
```

The suite starts an isolated static server on port `4173` and uses a fresh browser context for each test, so saved student progress is not reused.

## Routing

GitHub Pages-safe Hash routes support browser history and shared links:

- Home: `#/`
- Unit: `#/unit/1`
- Chapter: `#/unit/1/chapter/1-1`
- Knowledge Point: `#/unit/1/chapter/1-1/kp/1`

Legacy `#unit-1`, `#chapter-1-1`, `#kp-1`, and old v2 filename links are migrated to the new routes.

## Progress and Quiz Notes

- Existing `BCScienceConnections10_Checklist_v2` and `BCScienceConnections10_QuizGate_v1` localStorage data remains compatible.
- Progress is stored only in the visitor's browser and does not sync across browsers, devices, or private sessions.
- Answer choices are reshuffled whenever a Quiz opens or is retried.
- Reset Progress requires confirmation and clears checklist and Quiz-pass state.
- MathJax loads from `https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js`. Raw TeX remains visible if the CDN is unavailable.

## GitHub Pages Deployment

The workflow in `.github/workflows/pages.yml` publishes the static shell, modules, split data, README, Markdown source, `.nojekyll`, and old-URL redirect shim to the `gh-pages` branch. Repository Pages settings should use **Deploy from a branch > gh-pages > root**.

The published root URL is:

`https://yiyangd.github.io/Science10-checklist/`
