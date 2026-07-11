import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "data");
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(dataDir, relativePath), "utf8"));
const sha = value => crypto.createHash("sha256").update(value).digest("hex");
const fail = message => { throw new Error(message); };

const index = readJson("course-index.json");
const contentManifest = readJson("content-manifest.json");
const quizManifest = readJson("quiz-manifest.json");
const searchIndex = readJson("search-index.json");

if (index.units.length !== 4) fail(`Expected 4 Units, found ${index.units.length}.`);
if (index.units.flatMap(unit => unit.chapters).length !== 16) fail("Expected 16 Chapters.");
if (index.totalKps !== 572) fail(`Expected totalKps 572, found ${index.totalKps}.`);

const units = index.units.map(unit => readJson(`units/${unit.id}.json`));
const kps = units.flatMap(unit => unit.chapters.flatMap(chapter => chapter.concepts.flatMap(concept => concept.kps)));
if (kps.length !== 572 || new Set(kps.map(kp => kp.id)).size !== 572) fail("Unit data does not contain 572 unique KPs.");

const contentRecords = Object.fromEntries(kps.map(kp => [kp.id, sha(JSON.stringify({
  id: kp.id,
  titleHtml: kp.titleHtml,
  coreHtml: kp.coreHtml,
  applicationHtml: kp.applicationHtml
}))]));
if (JSON.stringify(contentRecords) !== JSON.stringify(contentManifest.records)) fail("Academic content hash validation failed.");
if (sha(JSON.stringify(contentRecords)) !== contentManifest.aggregateHash) fail("Academic aggregate hash validation failed.");
if (sha(index.howToHtml) !== contentManifest.howToHash) fail("Study tips content hash validation failed.");
if (sha(index.fullSummaryHtml) !== contentManifest.fullSummaryHash) fail("Full course summary hash validation failed.");
for (const unit of units) {
  if (sha(unit.summaryHtml) !== contentManifest.unitSummaryHashes[unit.id]) fail(`${unit.id} summary hash validation failed.`);
}

const quizSets = index.units.map(unit => readJson(`quizzes/${unit.id}.json`));
const quizzes = Object.assign({}, ...quizSets);
let questionCount = 0;
for (const [kpId, quiz] of Object.entries(quizzes)) {
  if (!Array.isArray(quiz.questions) || quiz.questions.length !== 3) fail(`${kpId} does not have 3 questions.`);
  for (const question of quiz.questions) {
    questionCount += 1;
    if (!Array.isArray(question.choices) || question.choices.length !== 4) fail(`${question.id} does not have 4 choices.`);
    if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) fail(`${question.id} has an invalid correctIndex.`);
    if (!question.explanation) fail(`${question.id} has no explanation.`);
  }
}
if (Object.keys(quizzes).length !== 572 || questionCount !== 1716) fail("Quiz totals are incorrect.");

const quizRecords = Object.fromEntries(Object.entries(quizzes).map(([kpId, quiz]) => [kpId, sha(JSON.stringify(quiz))]));
if (JSON.stringify(quizRecords) !== JSON.stringify(quizManifest.records)) fail("Quiz content hash validation failed.");
if (sha(JSON.stringify(quizRecords)) !== quizManifest.aggregateHash) fail("Quiz aggregate hash validation failed.");

const searchKps = searchIndex.filter(entry => entry.type === "kp");
if (searchKps.length !== 572 || new Set(searchKps.map(entry => entry.id)).size !== 572) fail("Search index does not contain 572 unique KPs.");

console.log(JSON.stringify({
  units: index.units.length,
  chapters: index.units.flatMap(unit => unit.chapters).length,
  kps: kps.length,
  quizzes: Object.keys(quizzes).length,
  questions: questionCount,
  searchEntries: searchIndex.length,
  academicContentHash: contentManifest.aggregateHash,
  quizContentHash: quizManifest.aggregateHash
}, null, 2));
