import { loadCourseIndex, loadSearchIndex, loadUnit } from "./data-store.js";
import { parseRoute, replaceHash, startRouter } from "./router.js";
import {
  loadLastRoute,
  loadQuizPassState,
  migrateLegacyProgress,
  resetProgress,
  saveLastRoute
} from "./storage.js";
import { QuizModal } from "./quiz-modal.js";

const appView = document.getElementById("appView");
const routeStatus = document.getElementById("routeStatus");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const progressTrack = document.querySelector(".progress-track");
const appBar = document.querySelector(".app-bar");
const searchBox = document.getElementById("searchBox");
const searchPanel = document.getElementById("searchPanel");
const searchStatus = document.getElementById("searchStatus");
const searchResults = document.getElementById("searchResults");
const expandAllButton = document.getElementById("expandAll");
const collapseAllButton = document.getElementById("collapseAll");
const resetButton = document.getElementById("resetProgress");
const backToTop = document.getElementById("backToTop");

let course;
let currentRoute;
let searchData;
let searchTimer;
let renderVersion = 0;

const quizModal = new QuizModal({
  onPass: kpId => {
    syncGlobalProgress();
    syncVisibleKp(kpId);
  }
});

function allKpIds() {
  return Array.from({ length: course.totalKps }, (_, index) => `kp-${index + 1}`);
}

function completedCount(start = 1, end = course.totalKps) {
  const passed = loadQuizPassState();
  let total = 0;
  for (let number = start; number <= end; number += 1) {
    if (passed[`kp-${number}`]) total += 1;
  }
  return total;
}

function percentage(completed, total) {
  return total ? Math.round((completed / total) * 100) : 0;
}

function syncGlobalProgress() {
  const completed = completedCount();
  const pct = percentage(completed, course.totalKps);
  progressText.textContent = `${completed} of ${course.totalKps} Knowledge Points completed — ${pct}%`;
  progressFill.style.width = `${pct}%`;
  progressTrack.setAttribute("aria-valuenow", String(pct));
}

function syncAppBarHeight() {
  document.documentElement.style.setProperty("--app-bar-height", `${Math.ceil(appBar.getBoundingClientRect().height)}px`);
}

function unitTone(unitNumber) {
  return `unit-tone-${unitNumber}`;
}

function displayChapterNumber(chapterNumber) {
  return chapterNumber.replace("-", ".");
}

function progressMarkup(completed, total) {
  const pct = percentage(completed, total);
  return `
    <div class="card-progress">
      <div class="card-progress-row"><span>${completed} of ${total}</span><strong>${pct}%</strong></div>
      <div class="mini-progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
    </div>
  `;
}

function breadcrumbs(items) {
  const content = items.map((item, index) => {
    const separator = index ? '<span aria-hidden="true">&rsaquo;</span>' : "";
    return `${separator}${item.href ? `<a href="${item.href}">${item.label}</a>` : `<span aria-current="page">${item.label}</span>`}`;
  }).join("");
  const parent = [...items].reverse().find(item => item.href);
  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      ${parent ? `<a href="${parent.href}" aria-label="Back to ${parent.label}">&larr; Back</a><span aria-hidden="true">|</span>` : ""}
      ${content}
    </nav>
  `;
}

function setView(html) {
  appView.innerHTML = `<div class="view-enter">${html}</div>`;
  appView.setAttribute("aria-busy", "false");
  const heading = appView.querySelector("h1")?.textContent.trim();
  routeStatus.textContent = heading ? `${heading} loaded.` : "View loaded.";
  appView.focus({ preventScroll: true });
  syncAppBarHeight();
  typeset(appView);
}

function typeset(container) {
  if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([container]).catch(() => {});
}

function showContextControls(show) {
  expandAllButton.hidden = !show;
  collapseAllButton.hidden = !show;
  appBar.classList.toggle("chapter-mode", show);
  requestAnimationFrame(syncAppBarHeight);
}

function renderHome() {
  showContextControls(false);
  const lastRoute = loadLastRoute();
  const cards = course.units.map(unit => {
    const completed = completedCount(unit.kpStart, unit.kpEnd);
    const continuing = lastRoute.startsWith(`#/unit/${unit.number}`);
    return `
      <a class="course-card ${unitTone(unit.number)}" href="#/unit/${unit.number}">
        <p class="card-eyebrow">Unit ${unit.number}</p>
        <h2>${unit.titleHtml.replace(/^Unit \d+:\s*/, "")}</h2>
        <div class="chapter-preview">
          ${unit.chapters.map(chapter => `<span>Chapter ${displayChapterNumber(chapter.number)}: ${chapter.kpCount} KPs</span>`).join("")}
        </div>
        ${progressMarkup(completed, unit.kpCount)}
        <span class="card-action">${continuing ? "Continue" : "Open unit"}<span aria-hidden="true">&rarr;</span></span>
      </a>
    `;
  }).join("");

  setView(`
    <header class="view-header">
      <div><h1>Course Units</h1><p class="view-meta">4 Units · 16 Chapters · 572 Knowledge Points</p></div>
    </header>
    <section class="card-grid" aria-label="Course Units">${cards}</section>
    <details class="study-tips"><summary>Study tips</summary><div class="summary-content">${course.howToHtml}</div></details>
    <div class="summary-link-row"><a class="text-link" href="#/summary">Open full course summary &rarr;</a></div>
  `);
}

function firstIncompleteChapter(unit) {
  return unit.chapters.find(chapter => completedCount(
    chapter.concepts[0].kps[0].number,
    chapter.concepts.at(-1).kps.at(-1).number
  ) < chapter.kpCount) || unit.chapters[0];
}

async function renderUnit(route, version) {
  showContextControls(false);
  const unitSummary = course.units.find(unit => unit.number === route.unitNumber);
  if (!unitSummary) return renderNotFound();
  const unit = await loadUnit(route.unitNumber);
  if (version !== renderVersion) return;
  const lastRoute = loadLastRoute();
  const defaultChapter = firstIncompleteChapter(unit);
  const continueRoute = lastRoute.startsWith(`#/unit/${unit.number}/chapter/`)
    ? lastRoute
    : `#/unit/${unit.number}/chapter/${defaultChapter.number}`;

  const cards = unit.chapters.map(chapter => {
    const first = chapter.concepts[0].kps[0].number;
    const last = chapter.concepts.at(-1).kps.at(-1).number;
    const completed = completedCount(first, last);
    return `
      <a class="course-card ${unitTone(unit.number)}" href="#/unit/${unit.number}/chapter/${chapter.number}">
        <p class="card-eyebrow">Chapter ${displayChapterNumber(chapter.number)}</p>
        <h2>${chapter.titleHtml.replace(/^Chapter [\d.]+:\s*/, "")}</h2>
        <div class="chapter-preview"><span>${chapter.concepts.length} Concepts and investigations</span></div>
        ${progressMarkup(completed, chapter.kpCount)}
        <span class="card-action">Open chapter<span aria-hidden="true">&rarr;</span></span>
      </a>
    `;
  }).join("");

  setView(`
    ${breadcrumbs([{ label: "Home", href: "#/" }, { label: `Unit ${unit.number}` }])}
    <header class="view-header">
      <div><h1>${unit.titleHtml}</h1><p class="view-meta">4 Chapters · ${unit.kpCount} Knowledge Points</p></div>
      <a class="text-link" href="${continueRoute}">Continue learning &rarr;</a>
    </header>
    <section class="card-grid" aria-label="Unit ${unit.number} Chapters">${cards}</section>
    <details class="unit-summary"><summary>Unit ${unit.number} summary</summary><div class="summary-content">${unit.summaryHtml}</div></details>
  `);
}

function kpMarkup(kp, unitNumber) {
  const passed = Boolean(loadQuizPassState()[kp.id]);
  return `
    <article id="${kp.id}" class="kp-item${passed ? " is-passed" : ""}" data-kp-id="${kp.id}">
      <div class="kp-heading-row">
        <label class="kp-label" for="check-${kp.id}">
          <input id="check-${kp.id}" class="kp-check" type="checkbox" data-kp-id="${kp.id}" data-unit-number="${unitNumber}" ${passed ? "checked" : ""} aria-label="${kp.title.replace(/"/g, "&quot;")} ${passed ? "quiz passed; open for practice" : "quiz required"}">
          <span class="kp-title">${kp.titleHtml}</span>
        </label>
        <span class="quiz-status">${passed ? "Passed" : "Quiz required"}</span>
      </div>
      <div class="kp-details">
        <div><span class="kp-detail-label">Core idea/formula:</span> ${kp.coreHtml}</div>
        <div><span class="kp-detail-label">Key application:</span> ${kp.applicationHtml}</div>
      </div>
    </article>
  `;
}

async function renderChapter(route, version) {
  showContextControls(true);
  const unit = await loadUnit(route.unitNumber);
  if (version !== renderVersion) return;
  const chapter = unit.chapters.find(candidate => candidate.number === route.chapterNumber);
  if (!chapter) return renderNotFound();
  saveLastRoute(route.canonical);

  const concepts = chapter.concepts.map(concept => `
    <section id="${concept.id}" class="concept-section">
      <button class="concept-toggle" type="button" aria-expanded="true" aria-controls="body-${concept.id}">
        <strong>${concept.titleHtml}</strong><span class="chevron" aria-hidden="true">&minus;</span>
      </button>
      <div id="body-${concept.id}" class="concept-body">
        ${concept.kps.map(kp => kpMarkup(kp, unit.number)).join("")}
      </div>
    </section>
  `).join("");

  setView(`
    ${breadcrumbs([
      { label: "Home", href: "#/" },
      { label: `Unit ${unit.number}`, href: `#/unit/${unit.number}` },
      { label: `Chapter ${displayChapterNumber(chapter.number)}` }
    ])}
    <header class="view-header">
      <div><h1>${chapter.titleHtml}</h1><p class="view-meta">${chapter.concepts.length} Concepts and investigations · ${chapter.kpCount} Knowledge Points</p></div>
    </header>
    <div class="concept-list">${concepts}</div>
  `);

  bindChapterInteractions(unit.number);
  focusRouteTarget(route);
}

function bindChapterInteractions(unitNumber) {
  appView.querySelectorAll(".concept-toggle").forEach(button => {
    button.addEventListener("click", () => setConceptExpanded(button, button.getAttribute("aria-expanded") !== "true"));
  });
  appView.querySelectorAll(".kp-check").forEach(checkbox => {
    checkbox.addEventListener("click", event => {
      event.preventDefault();
      const passed = Boolean(loadQuizPassState()[checkbox.dataset.kpId]);
      checkbox.checked = passed;
      quizModal.open(checkbox.dataset.kpId, unitNumber, checkbox).catch(showError);
    });
    checkbox.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        quizModal.open(checkbox.dataset.kpId, unitNumber, checkbox).catch(showError);
      }
    });
  });
}

function setConceptExpanded(button, expanded) {
  const body = document.getElementById(button.getAttribute("aria-controls"));
  if (!body) return;
  body.hidden = !expanded;
  button.setAttribute("aria-expanded", String(expanded));
  button.querySelector(".chevron").innerHTML = expanded ? "&minus;" : "&plus;";
}

function setAllConcepts(expanded) {
  appView.querySelectorAll(".concept-toggle").forEach(button => setConceptExpanded(button, expanded));
}

function focusRouteTarget(route) {
  const id = route.kpNumber ? `kp-${route.kpNumber}` : route.conceptId;
  if (!id) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;
  const concept = target.closest(".concept-section");
  const toggle = concept?.querySelector(".concept-toggle");
  if (toggle) setConceptExpanded(toggle, true);
  requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start", behavior: "smooth" });
    target.classList.add("target-highlight");
    window.setTimeout(() => target.classList.remove("target-highlight"), 1800);
  });
}

function syncVisibleKp(kpId) {
  const item = document.querySelector(`.kp-item[data-kp-id="${kpId}"]`);
  if (!item) return;
  item.classList.add("is-passed");
  const checkbox = item.querySelector(".kp-check");
  checkbox.checked = true;
  checkbox.setAttribute("aria-label", `${item.querySelector(".kp-title").textContent.trim()} quiz passed; open for practice`);
  item.querySelector(".quiz-status").textContent = "Passed";
}

function renderSummary() {
  showContextControls(false);
  setView(`
    ${breadcrumbs([{ label: "Home", href: "#/" }, { label: "Full course summary" }])}
    <div class="academic-summary">${course.fullSummaryHtml}</div>
  `);
}

function renderNotFound() {
  showContextControls(false);
  setView(`
    ${breadcrumbs([{ label: "Home", href: "#/" }, { label: "Not found" }])}
    <div class="error-state"><h1>Page not found</h1><p>The requested Unit, Chapter, Concept, or Knowledge Point could not be found.</p></div>
  `);
}

function showError(error) {
  console.error(error);
  appView.setAttribute("aria-busy", "false");
  appView.innerHTML = `<div class="error-state"><h1>Unable to load this view</h1><p>${error.message}</p><p><a href="#/">Return home</a></p></div>`;
}

async function renderHash(hash) {
  const version = ++renderVersion;
  currentRoute = parseRoute(hash, course);
  if (currentRoute.canonical !== hash && currentRoute.name !== "not-found") {
    replaceHash(currentRoute.canonical);
  }
  appView.setAttribute("aria-busy", "true");
  try {
    if (currentRoute.name === "home") renderHome();
    else if (currentRoute.name === "unit") await renderUnit(currentRoute, version);
    else if (currentRoute.name === "chapter") await renderChapter(currentRoute, version);
    else if (currentRoute.name === "summary") renderSummary();
    else renderNotFound();
  } catch (error) {
    if (version === renderVersion) showError(error);
  }
}

async function runSearch() {
  const query = searchBox.value.trim().toLowerCase();
  if (!query) {
    closeSearch();
    return;
  }
  searchPanel.hidden = false;
  searchStatus.textContent = "Searching the full course…";
  if (!searchData) searchData = await loadSearchIndex();
  if (query !== searchBox.value.trim().toLowerCase()) return;
  const results = searchData.filter(entry => entry.searchText.includes(query)).slice(0, 30);
  searchStatus.textContent = results.length
    ? `Showing ${results.length}${results.length === 30 ? "+" : ""} result(s).`
    : "No matching Units, Chapters, Concepts, or Knowledge Points.";
  searchResults.innerHTML = results.map(result => `
    <a class="search-result" href="${result.route}"><strong>${result.title}</strong><span>${result.type}</span></a>
  `).join("");
}

function closeSearch() {
  searchPanel.hidden = true;
  searchStatus.textContent = "";
  searchResults.innerHTML = "";
}

function initializeControls() {
  searchBox.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => runSearch().catch(showError), 120);
  });
  searchBox.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      searchBox.value = "";
      closeSearch();
    }
  });
  searchResults.addEventListener("click", () => {
    searchBox.value = "";
    closeSearch();
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".app-bar-inner")) closeSearch();
  });
  expandAllButton.addEventListener("click", () => setAllConcepts(true));
  collapseAllButton.addEventListener("click", () => setAllConcepts(false));
  resetButton.addEventListener("click", () => {
    if (!window.confirm("Reset all checklist progress for this browser?")) return;
    resetProgress();
    migrateLegacyProgress(allKpIds());
    syncGlobalProgress();
    renderHash(window.location.hash);
  });
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => { backToTop.hidden = window.scrollY <= 600; }, { passive: true });
  window.addEventListener("resize", syncAppBarHeight);
  if ("ResizeObserver" in window) new ResizeObserver(syncAppBarHeight).observe(appBar);
}

async function init() {
  course = await loadCourseIndex();
  migrateLegacyProgress(allKpIds());
  syncGlobalProgress();
  initializeControls();
  startRouter(renderHash);
  await renderHash(window.location.hash);
}

init().catch(showError);
