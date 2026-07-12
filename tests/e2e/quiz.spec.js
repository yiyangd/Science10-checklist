import { test, expect } from "./fixtures.js";
import { answerQuiz, choiceOrder, gotoApp, loadQuiz, openQuiz } from "./helpers.js";

const quiz = loadQuiz(1, "kp-1");

test.beforeEach(async ({ page }) => {
  await gotoApp(page, "#/unit/1/chapter/1-1/kp/1");
});

test("Quiz has 3 questions and 12 choices", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await expect(page.locator("#quizForm fieldset")).toHaveCount(3);
  await expect(page.locator('#quizForm input[type="radio"]')).toHaveCount(12);
});

test("an incorrect attempt does not check the Knowledge Point", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(page.locator("#check-kp-1")).not.toBeChecked();
  await expect(page.locator(".quiz-summary-feedback")).toContainText("Score: 0/3");

  const feedback = await page.locator(".quiz-feedback").allTextContents();
  expect(feedback).toHaveLength(3);
  for (const message of feedback) expect(message.trim()).toMatch(/[.!?]$/);
});

test("3 out of 3 checks, saves, and restores progress after reload", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, true);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(page.locator("#check-kp-1")).toBeChecked();
  await expect(page.locator("#progressText")).toContainText("1 of 572");
  await expect(page.locator(".quiz-summary-feedback")).toContainText("Passed");
  await page.locator("#quizClose").click();

  await page.reload();
  await expect(page.locator("#check-kp-1")).toBeChecked();
  await expect(page.locator("#progressText")).toContainText("1 of 572");
});

test("Retry reshuffles choices without depending on answer position", async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    Math.random = () => (calls++ < 9 ? 0 : 0.999);
  });
  await page.reload();
  await openQuiz(page, "kp-1");
  const before = await choiceOrder(page);
  await answerQuiz(page, quiz, false);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await page.getByRole("button", { name: "Retry" }).click();
  const after = await choiceOrder(page);
  expect(after).not.toEqual(before);
});

test("Reset Progress requires confirmation and clears Quiz state", async ({ page }) => {
  await openQuiz(page, "kp-1");
  await answerQuiz(page, quiz, true);
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await page.locator("#quizClose").click();
  await expect(page.locator("#check-kp-1")).toBeChecked();

  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Reset progress" }).click();
  await expect(page.locator("#check-kp-1")).toBeChecked();

  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reset progress" }).click();
  await expect(page.locator("#check-kp-1")).not.toBeChecked();
  await expect(page.locator("#progressText")).toContainText("0 of 572");
});
