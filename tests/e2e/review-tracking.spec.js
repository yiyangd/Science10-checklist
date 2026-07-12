import { test, expect } from "./fixtures.js";
import { answerQuiz, gotoApp, loadQuiz, openQuiz } from "./helpers.js";

const REVIEW_KEY = "BCScienceConnections10_Review_v1";
const quiz = loadQuiz(1, "kp-1");

async function reviewState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), REVIEW_KEY);
}

test.beforeEach(async ({ page }) => {
  await gotoApp(page, "#/unit/1/chapter/1-1/kp/1");
});

test("a submitted non-passing attempt creates minimal Review history", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();

  const state = await reviewState(page);
  expect(state.schemaVersion).toBe(1);
  expect(Object.keys(state.records)).toEqual(["kp-1"]);
  expect(state.records["kp-1"]).toMatchObject({
    totalAttempts: 1,
    nonPassingAttempts: 1,
    lastScore: 0,
    lastResult: "needs-practice",
    firstPassedAt: null,
    lastPassedAt: null
  });
  expect(Object.keys(state.records["kp-1"]).sort()).toEqual([
    "firstPassedAt",
    "lastAttemptAt",
    "lastPassedAt",
    "lastResult",
    "lastScore",
    "nonPassingAttempts",
    "totalAttempts"
  ]);
});

test("Retry does not count until the next submission", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await page.getByRole("button", { name: "Retry" }).click();
  expect((await reviewState(page)).records["kp-1"].totalAttempts).toBe(1);

  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  expect((await reviewState(page)).records["kp-1"]).toMatchObject({
    totalAttempts: 2,
    nonPassingAttempts: 2
  });
});

test("non-passing then passing persists history across reload", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await page.getByRole("button", { name: "Retry" }).click();
  await answerQuiz(page, quiz, true);
  await page.getByRole("button", { name: "Submit quiz" }).click();

  await expect(page.locator("#check-kp-1")).toBeChecked();
  const beforeReload = await reviewState(page);
  expect(beforeReload.records["kp-1"]).toMatchObject({
    totalAttempts: 2,
    nonPassingAttempts: 1,
    lastScore: 3,
    lastResult: "passed"
  });
  expect(beforeReload.records["kp-1"].firstPassedAt).toBeTruthy();
  expect(beforeReload.records["kp-1"].lastPassedAt).toBeTruthy();

  await page.locator("#quizClose").click();
  await page.reload();
  await expect(page.locator("#check-kp-1")).toBeChecked();
  expect(await reviewState(page)).toEqual(beforeReload);
});

test("incorrect practice keeps an already-passed KP complete", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, true);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await page.getByRole("button", { name: "Retry" }).click();
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();

  await expect(page.locator("#check-kp-1")).toBeChecked();
  await expect(page.locator("#progressText")).toContainText("1 of 572");
  expect((await reviewState(page)).records["kp-1"]).toMatchObject({
    totalAttempts: 2,
    nonPassingAttempts: 1,
    lastResult: "needs-practice",
    lastScore: 0
  });
});

test("malformed Review JSON recovers on the next submitted attempt", async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, "{malformed"), REVIEW_KEY);
  await page.reload();
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();

  expect((await reviewState(page)).records["kp-1"]).toMatchObject({
    totalAttempts: 1,
    nonPassingAttempts: 1,
    lastResult: "needs-practice"
  });
});

test("unsupported or invalid Review records are sanitized without affecting Quiz use", async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({
    schemaVersion: 99,
    updatedAt: "not-a-date",
    records: {
      "kp-1": { selectedAnswer: "should not be retained" },
      "kp-999": { totalAttempts: 500 }
    }
  })), REVIEW_KEY);
  await page.reload();

  const recovered = await page.evaluate(async () => {
    const module = await import("./js/review-storage.js");
    return module.loadReviewState();
  });
  expect(recovered).toEqual({ schemaVersion: 1, updatedAt: null, records: {} });

  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  expect(Object.keys((await reviewState(page)).records)).toEqual(["kp-1"]);
});

test("Reset cancel preserves Review history and confirm clears it", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await page.locator("#quizClose").click();

  page.once("dialog", dialog => {
    expect(dialog.message()).toContain("Review history");
    dialog.dismiss();
  });
  await page.getByRole("button", { name: "Reset progress" }).click();
  expect(await reviewState(page)).not.toBeNull();

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reset progress" }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), REVIEW_KEY)).toBeNull();
});

test("blocked Review persistence keeps Quiz feedback and session history usable", async ({ page }) => {
  await page.addInitScript(key => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("Blocked for test", "QuotaExceededError");
      return setItem.call(this, name, value);
    };
  }, REVIEW_KEY);
  await page.reload();
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();

  await expect(page.locator(".quiz-summary-feedback")).toContainText("Score: 0/3");
  expect(await page.evaluate(key => localStorage.getItem(key), REVIEW_KEY)).toBeNull();
  const sessionState = await page.evaluate(async () => {
    const module = await import("./js/review-storage.js");
    return module.loadReviewState();
  });
  expect(sessionState.records["kp-1"]).toMatchObject({
    totalAttempts: 1,
    nonPassingAttempts: 1
  });
});
