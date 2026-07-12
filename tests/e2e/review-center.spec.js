import { test, expect } from "./fixtures.js";
import { answerQuiz, gotoApp, loadQuiz } from "./helpers.js";

const REVIEW_KEY = "BCScienceConnections10_Review_v1";
const PASS_KEY = "BCScienceConnections10_QuizGate_v1";
const CHECKLIST_KEY = "BCScienceConnections10_Checklist_v2";
const quiz = loadQuiz(1, "kp-1");

function reviewRecord({ result = "needs-practice", attempts = 1, nonPassing = 1, date = "2026-07-11T18:30:00.000Z" } = {}) {
  const passed = result === "passed";
  return {
    totalAttempts: attempts,
    nonPassingAttempts: nonPassing,
    lastScore: passed ? 3 : 0,
    lastResult: result,
    lastAttemptAt: date,
    firstPassedAt: passed ? date : null,
    lastPassedAt: passed ? date : null
  };
}

async function seedReview(page, records, passed = {}) {
  await page.addInitScript(({ reviewKey, passKey, records, passed }) => {
    localStorage.setItem(reviewKey, JSON.stringify({
      schemaVersion: 1,
      updatedAt: "2026-07-11T18:30:00.000Z",
      records
    }));
    localStorage.setItem(passKey, JSON.stringify(passed));
  }, { reviewKey: REVIEW_KEY, passKey: PASS_KEY, records, passed });
}

async function reviewRowOrder(page) {
  return page.locator(".review-row").evaluateAll(rows => rows.map(row => row.dataset.reviewKp));
}

test("Home keeps four Unit cards and provides a useful zero-count Review entry", async ({ page }) => {
  await gotoApp(page);
  await expect(page.locator(".course-card")).toHaveCount(4);
  await expect(page.locator(".review-home-entry")).toBeVisible();
  await expect(page.locator("#reviewActionCount")).toHaveText("0");

  await page.locator('a[href="#/review"]').click();
  await expect(page).toHaveURL(/#\/review$/);
  await expect(page.locator("main h1")).toHaveText("Review & Practice");
  await expect(page.getByRole("heading", { name: "No Review history yet" })).toBeVisible();
  await expect(page.locator("main h1")).toHaveCount(1);
});

test("a non-passing Quiz appears on Home and in Review without refresh", async ({ page }) => {
  await gotoApp(page, "#/unit/1/chapter/1-1/kp/1");
  await page.locator("#check-kp-1").click();
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await page.locator("#quizClose").click();
  await page.goto("/#/");

  await expect(page.locator("#reviewActionCount")).toHaveText("1");
  await page.locator('a[href="#/review"]').click();
  const row = page.locator('[data-review-kp="kp-1"]');
  await expect(row).toBeVisible();
  await expect(row.locator(".review-status")).toHaveText("Needs practice");

  await page.reload();
  await expect(page.locator('[data-review-kp="kp-1"] .review-status')).toHaveText("Needs practice");
});

test("Unit and status filters select the intended Review rows", async ({ page }) => {
  await seedReview(page, {
    "kp-1": reviewRecord(),
    "kp-162": { ...reviewRecord({ attempts: 2 }), firstPassedAt: "2026-07-10T18:30:00.000Z", lastPassedAt: "2026-07-10T18:30:00.000Z" },
    "kp-306": reviewRecord({ result: "passed", attempts: 2 })
  }, { "kp-162": true, "kp-306": true });
  await gotoApp(page, "#/review");
  await expect(page.locator(".review-row")).toHaveCount(3);
  expect(await page.locator(".review-row").evaluateAll(rows => rows.map(row => row.dataset.reviewKp)))
    .toEqual(["kp-1", "kp-162", "kp-306"]);

  await page.locator("#reviewUnitFilter").selectOption("2");
  await expect(page.locator(".review-row")).toHaveCount(1);
  await expect(page.locator('[data-review-kp="kp-162"]')).toBeVisible();

  await page.locator("#reviewUnitFilter").selectOption("all");
  await page.locator("#reviewStatusFilter").selectOption("recently-passed");
  await expect(page.locator(".review-row")).toHaveCount(1);
  await expect(page.locator('[data-review-kp="kp-306"]')).toBeVisible();
});

test("Chapter options follow the selected Unit and reset invalid selections", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord(), "kp-40": reviewRecord() });
  await gotoApp(page, "#/review");

  const allOptions = await page.locator("#reviewChapterFilter option").evaluateAll(options => options.map(option => ({
    value: option.value,
    label: option.textContent.trim()
  })));
  expect(allOptions).toHaveLength(17);
  expect(allOptions[1].label).toContain("Unit 1 - Chapter 1.1");
  expect(allOptions[16].label).toContain("Unit 4 - Chapter 4.4");

  await page.locator("#reviewUnitFilter").selectOption("1");
  const unitOneValues = await page.locator("#reviewChapterFilter option").evaluateAll(options => options.map(option => option.value));
  expect(unitOneValues).toEqual(["all", "1-1", "1-2", "1-3", "1-4"]);
  await page.locator("#reviewChapterFilter").selectOption("1-2");
  await expect(page.locator('[data-review-kp="kp-40"]')).toBeVisible();

  await page.locator("#reviewUnitFilter").selectOption("2");
  await expect(page.locator("#reviewChapterFilter")).toHaveValue("all");
  const unitTwoValues = await page.locator("#reviewChapterFilter option").evaluateAll(options => options.map(option => option.value));
  expect(unitTwoValues).toEqual(["all", "2-1", "2-2", "2-3", "2-4"]);

  for (const unitNumber of [3, 4]) {
    await page.locator("#reviewUnitFilter").selectOption(String(unitNumber));
    const values = await page.locator("#reviewChapterFilter option").evaluateAll(options => options.map(option => option.value));
    expect(values).toEqual(["all", `${unitNumber}-1`, `${unitNumber}-2`, `${unitNumber}-3`, `${unitNumber}-4`]);
  }
});

test("all sorting modes and combined filters produce deterministic order", async ({ page }) => {
  await seedReview(page, {
    "kp-1": reviewRecord({ attempts: 2, date: "2026-07-09T18:30:00.000Z" }),
    "kp-40": reviewRecord({ attempts: 5, date: "2026-07-12T18:30:00.000Z" }),
    "kp-162": {
      ...reviewRecord({ attempts: 4, date: "2026-07-11T18:30:00.000Z" }),
      firstPassedAt: "2026-07-08T18:30:00.000Z",
      lastPassedAt: "2026-07-08T18:30:00.000Z"
    },
    "kp-306": reviewRecord({ result: "passed", attempts: 3, date: "2026-07-10T18:30:00.000Z" })
  }, { "kp-162": true, "kp-306": true });
  await gotoApp(page, "#/review");

  expect(await reviewRowOrder(page)).toEqual(["kp-40", "kp-1", "kp-162", "kp-306"]);
  await page.locator("#reviewSort").selectOption("recent");
  expect(await reviewRowOrder(page)).toEqual(["kp-40", "kp-162", "kp-306", "kp-1"]);
  await page.locator("#reviewSort").selectOption("course");
  expect(await reviewRowOrder(page)).toEqual(["kp-1", "kp-40", "kp-162", "kp-306"]);
  await page.locator("#reviewSort").selectOption("attempts");
  expect(await reviewRowOrder(page)).toEqual(["kp-40", "kp-162", "kp-306", "kp-1"]);

  await page.locator("#reviewUnitFilter").selectOption("1");
  await page.locator("#reviewChapterFilter").selectOption("1-1");
  await page.locator("#reviewStatusFilter").selectOption("needs-practice");
  expect(await reviewRowOrder(page)).toEqual(["kp-1"]);
});

test("Review Center distinguishes no actionable items from no filter matches", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord({ result: "passed", attempts: 1, nonPassing: 0 }) }, { "kp-1": true });
  await gotoApp(page, "#/review");
  await expect(page.getByRole("heading", { name: "Nothing needs review right now" })).toBeVisible();

  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({
    schemaVersion: 1,
    updatedAt: "2026-07-11T18:30:00.000Z",
    records: { "kp-1": {
      totalAttempts: 1,
      nonPassingAttempts: 1,
      lastScore: 0,
      lastResult: "needs-practice",
      lastAttemptAt: "2026-07-11T18:30:00.000Z",
      firstPassedAt: null,
      lastPassedAt: null
    } }
  })), REVIEW_KEY);
  await page.evaluate(() => { window.location.hash = "#/"; });
  await expect(page.locator("main h1")).toHaveText("Course Units");
  await page.locator('a[href="#/review"]').click();
  await page.locator("#reviewUnitFilter").selectOption("4");
  await expect(page.getByRole("heading", { name: "No matching Review items" })).toBeVisible();
});

test("Continue learning resolves the Review item and browser history returns", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord() });
  await gotoApp(page);
  await page.locator('a[href="#/review"]').click();
  await page.locator('[data-review-kp="kp-1"] a', { hasText: "Continue learning" }).click();
  await expect(page).toHaveURL(/#\/unit\/1\/chapter\/1-1\/kp\/1$/);
  await expect(page.locator("#kp-1")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/review$/);
  await expect(page.locator('[data-review-kp="kp-1"]')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/#\/unit\/1\/chapter\/1-1\/kp\/1$/);
});

test("Practice Quiz passes a Review item and restores focus", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord() });
  await gotoApp(page, "#/review");
  const trigger = page.locator('[data-review-kp="kp-1"] .review-quiz-button');
  await trigger.click();
  await expect(page.locator("#quizTitle")).toBeFocused();
  await answerQuiz(page, quiz, true);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(page.locator('[data-review-kp="kp-1"] .review-status')).toHaveText("Recently passed");
  await page.locator("#quizClose").click();
  await expect(trigger).toBeFocused();

  await page.goto("/#/");
  await expect(page.locator("#reviewActionCount")).toHaveText("0");
  await page.goto("/#/unit/1/chapter/1-1/kp/1");
  await expect(page.locator("#check-kp-1")).toBeChecked();
});

test("incorrect practice recommends Review without removing completion", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord({ result: "passed", attempts: 2 }) }, { "kp-1": true });
  await gotoApp(page, "#/review");
  const trigger = page.locator('[data-review-kp="kp-1"] .review-quiz-button');
  await trigger.click();
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(page.locator('[data-review-kp="kp-1"] .review-status')).toHaveText("Review recommended");
  await page.locator("#quizClose").click();
  await expect(trigger).toBeFocused();

  await page.locator('[data-review-kp="kp-1"] a', { hasText: "Continue learning" }).click();
  await expect(page.locator("#check-kp-1")).toBeChecked();
  await expect(page.locator("#progressText")).toContainText("1 of 572");
});

test("a filtered status transition removes the row after close and moves focus", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord() });
  await gotoApp(page, "#/review");
  await page.locator("#reviewStatusFilter").selectOption("needs-practice");
  await page.locator('[data-review-kp="kp-1"] .review-quiz-button').click();
  await answerQuiz(page, quiz, true);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(page.locator('[data-review-kp="kp-1"] .review-status')).toHaveText("Recently passed");
  await page.locator("#quizClose").click();

  await expect(page.locator('[data-review-kp="kp-1"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No matching Review items" })).toBeVisible();
  await expect(page.locator("#reviewFilterStatus")).toBeFocused();
  await expect(page.locator("#reviewFilterStatus")).toContainText("no longer matches");
});

test("Clear Review History requires confirmation and preserves completion", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord({ result: "passed", attempts: 2 }) }, { "kp-1": true });
  await gotoApp(page, "#/review");
  await expect(page.locator("#progressText")).toContainText("1 of 572");

  page.once("dialog", dialog => {
    expect(dialog.message()).toContain("Quiz pass state will remain");
    dialog.dismiss();
  });
  await page.locator("#clearReviewHistory").click();
  expect(await page.evaluate(key => localStorage.getItem(key), REVIEW_KEY)).not.toBeNull();
  await expect(page.locator('[data-review-kp="kp-1"]')).toBeVisible();

  page.once("dialog", dialog => dialog.accept());
  await page.locator("#clearReviewHistory").click();
  expect(await page.evaluate(key => localStorage.getItem(key), REVIEW_KEY)).toBeNull();
  await expect(page.getByRole("heading", { name: "Review history cleared" })).toBeVisible();
  await expect(page.locator("#clearReviewHistory")).toBeDisabled();
  await expect(page.locator("#progressText")).toContainText("1 of 572");

  await page.evaluate(() => { window.location.hash = "#/"; });
  await expect(page.locator("#reviewActionCount")).toHaveText("0");
  await page.evaluate(() => { window.location.hash = "#/unit/1/chapter/1-1/kp/1"; });
  await expect(page.locator("#check-kp-1")).toBeChecked();
});

test("global Reset clears completion, Quiz pass state, and Review history", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord({ result: "passed", attempts: 2 }) }, { "kp-1": true });
  await gotoApp(page, "#/review");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reset progress" }).click();

  const state = await page.evaluate(({ checklistKey, passKey, reviewKey }) => ({
    checklist: JSON.parse(localStorage.getItem(checklistKey) || "{}"),
    pass: JSON.parse(localStorage.getItem(passKey) || "{}"),
    review: localStorage.getItem(reviewKey)
  }), { checklistKey: CHECKLIST_KEY, passKey: PASS_KEY, reviewKey: REVIEW_KEY });
  expect(Object.values(state.checklist).some(Boolean)).toBe(false);
  expect(Object.values(state.pass).some(Boolean)).toBe(false);
  expect(state.review).toBeNull();
  await expect(page.locator("#progressText")).toContainText("0 of 572");
  await expect(page.getByRole("heading", { name: "No Review history yet" })).toBeVisible();
  await page.evaluate(() => { window.location.hash = "#/"; });
  await expect(page.locator("#reviewActionCount")).toHaveText("0");
});

test("Review data stays lazy until the Review route is opened", async ({ page }) => {
  await seedReview(page, { "kp-1": reviewRecord() });
  const localRequests = [];
  page.on("request", request => {
    if (request.url().includes("/data/")) localRequests.push(request.url());
  });
  await gotoApp(page);
  expect(localRequests.some(url => url.endsWith("/data/search-index.json"))).toBe(false);

  const searchResponse = page.waitForResponse(response => response.url().endsWith("/data/search-index.json") && response.ok());
  await page.locator('a[href="#/review"]').click();
  await searchResponse;
  await page.locator("#reviewUnitFilter").selectOption("1");
  await page.locator("#reviewChapterFilter").selectOption("1-1");
  await page.locator("#reviewStatusFilter").selectOption("needs-practice");
  await page.locator("#reviewSort").selectOption("course");
  expect(localRequests.some(url => url.includes("/data/units/"))).toBe(false);
  expect(localRequests.some(url => url.includes("/data/quizzes/"))).toBe(false);

  const quizResponse = page.waitForResponse(response => response.url().endsWith("/data/quizzes/unit-1.json") && response.ok());
  await page.locator('[data-review-kp="kp-1"] .review-quiz-button').click();
  await quizResponse;
  expect(localRequests.some(url => url.endsWith("/data/quizzes/unit-1.json"))).toBe(true);
  expect(localRequests.some(url => /\/data\/quizzes\/unit-[234]\.json$/.test(url))).toBe(false);
  expect(localRequests.some(url => url.includes("/data/units/"))).toBe(false);
});

for (const width of [390, 768, 1280, 1440]) {
  test(`Review Center has no horizontal overflow at ${width}px`, async ({ page }) => {
    await seedReview(page, {
      "kp-1": reviewRecord(),
      "kp-162": reviewRecord({ attempts: 2 }),
      "kp-306": reviewRecord({ result: "passed", attempts: 2 })
    }, { "kp-306": true });
    await page.setViewportSize({ width, height: 900 });
    await gotoApp(page, "#/review");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}

test("Review Center command targets remain at least 44px at 390px", async ({ page }) => {
  await seedReview(page, {
    "kp-1": reviewRecord(),
    "kp-162": reviewRecord({ attempts: 2 }),
    "kp-306": reviewRecord({ result: "passed", attempts: 2 })
  }, { "kp-306": true });
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "#/review");

  const undersized = await page.locator(".review-controls select, .review-actions .button, #clearReviewHistory").evaluateAll(elements => elements.filter(element => {
    const rect = element.getBoundingClientRect();
    return rect.width < 44 || rect.height < 44;
  }).map(element => element.textContent.trim()));
  expect(undersized).toEqual([]);
});
