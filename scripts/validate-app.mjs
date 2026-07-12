import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const fail = message => { throw new Error(message); };
const requiredFiles = [
  "index.html",
  "assets/styles.css",
  "js/app.js",
  "js/data-store.js",
  "js/router.js",
  "js/storage.js",
  "js/quiz-modal.js",
  "playwright.config.js",
  "package-lock.json",
  ".github/workflows/qa.yml",
  "tests/e2e/fixtures.js",
  "data/course-index.json",
  "data/search-index.json",
  "BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist_Interactive_v2.html"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing required file: ${file}`);
}

const index = read("index.html");
const app = read("js/app.js");
const router = read("js/router.js");
const storage = read("js/storage.js");
const workflow = read(".github/workflows/pages.yml");
const qaWorkflow = read(".github/workflows/qa.yml");
const packageJson = JSON.parse(read("package.json"));
const redirect = read("BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist_Interactive_v2.html");

if (index.includes('class="kp-check"')) fail("index.html must not contain the full KP list.");
if (!index.includes('type="module" src="./js/app.js"')) fail("index.html does not load the application module.");
if (index.includes("quiz-data.js")) fail("index.html still references the legacy Quiz bundle.");
if (!index.includes('id="routeStatus"') || index.includes('id="appView" tabindex="-1" aria-live=')) fail("Route changes must use a concise live region instead of announcing the full view.");
if (/<header class="hero">[\s\S]*?<h1[\s>]/.test(index)) fail("The persistent hero must not create a second page-level heading.");
if (!app.includes("loadSearchIndex")) fail("Global search is not wired to its lazy data loader.");
if (!app.includes("loadQuizPassState")) fail("Progress is not based on the saved full-course Quiz state.");
if (!router.includes("#chapter-") || !router.includes("#kp-")) fail("Legacy Chapter or KP anchors are not supported.");
if (!storage.includes("BCScienceConnections10_Checklist_v2") || !storage.includes("BCScienceConnections10_QuizGate_v1")) fail("Existing localStorage keys were not preserved.");
if (!workflow.includes("cp -R assets js data public/")) fail("Pages workflow does not publish modular assets and data.");
if (!workflow.includes("actions/setup-node@v4") || !workflow.includes("npm run validate") || !workflow.includes("npm run test:e2e")) fail("Pages workflow does not run static and browser validation before publishing.");
if (!packageJson.scripts?.["test:e2e"] || !packageJson.devDependencies?.["@playwright/test"]) fail("Playwright E2E scripts or dependency are missing.");
if (!qaWorkflow.includes("npx playwright install --with-deps chromium") || !qaWorkflow.includes("npm run test:e2e")) fail("QA workflow does not install Chromium and run the E2E suite.");
if (workflow.includes("Science10.pdf") || workflow.includes("Interactive_v1.html")) fail("Pages workflow includes an excluded local file.");
if (!redirect.includes('window.location.replace("./" + window.location.hash)')) fail("Old v2 URL redirect behavior changed.");
if (fs.existsSync(path.join(root, "quiz-data.js"))) fail("Legacy quiz-data.js should not remain after the split.");

const bytes = relativePath => fs.statSync(path.join(root, relativePath)).size;
const initialLocalBytes = [
  "index.html",
  "assets/styles.css",
  "js/app.js",
  "js/data-store.js",
  "js/router.js",
  "js/storage.js",
  "js/quiz-modal.js",
  "data/course-index.json"
].reduce((total, file) => total + bytes(file), 0);

console.log(JSON.stringify({
  indexBytes: bytes("index.html"),
  initialLocalBytes,
  legacyQuizBundlePresent: false,
  modularFiles: requiredFiles.length
}, null, 2));
