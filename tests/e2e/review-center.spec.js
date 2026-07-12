import { test, expect } from "./fixtures.js";
import { answerQuiz, gotoApp, loadQuiz } from "./helpers.js";

const REVIEW_KEY = "BCScienceConnections10_Review_v1";
const PASS_KEY = "BCScienceConnections10_QuizGate_v1";
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

test("Review data stays lazy until the Review route is opened", async ({ page }) => {
  const localRequests = [];
  page.on("request", request => {
    if (request.url().includes("/data/")) localRequests.push(request.url());
  });
  await gotoApp(page);
  expect(localRequests.some(url => url.endsWith("/data/search-index.json"))).toBe(false);

  const searchResponse = page.waitForResponse(response => response.url().endsWith("/data/search-index.json") && response.ok());
  await page.locator('a[href="#/review"]').click();
  await searchResponse;
  expect(localRequests.some(url => url.includes("/data/units/"))).toBe(false);
  expect(localRequests.some(url => url.includes("/data/quizzes/"))).toBe(false);
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

  const undersized = await page.locator(".review-controls select, .review-actions .button").evaluateAll(elements => elements.filter(element => {
    const rect = element.getBoundingClientRect();
    return rect.width < 44 || rect.height < 44;
  }).map(element => element.textContent.trim()));
  expect(undersized).toEqual([]);
});
