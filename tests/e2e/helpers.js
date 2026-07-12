import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "./fixtures.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export async function gotoApp(page, hash = "#/") {
  await page.goto(`/${hash}`);
  await expect(page.locator("main h1")).toBeVisible();
}

export async function openQuiz(page, kpId) {
  const trigger = page.locator(`#check-${kpId}`);
  await expect(trigger).toHaveCount(1);
  await trigger.click();
  await expect(page.locator("#quizModal")).toBeVisible();
  await expect(page.locator("#quizTitle")).toBeFocused();
  return trigger;
}

export function loadQuiz(unitNumber, kpId) {
  const quizzes = JSON.parse(fs.readFileSync(path.join(root, `data/quizzes/unit-${unitNumber}.json`), "utf8"));
  return quizzes[kpId];
}

export async function answerQuiz(page, quiz, correct) {
  for (const question of quiz.questions) {
    const choiceIndex = correct ? question.correctIndex : (question.correctIndex + 1) % question.choices.length;
    await page.locator(`input[name="${question.id}"][value="${choiceIndex}"]`).check();
  }
}

export async function choiceOrder(page) {
  return page.locator(".quiz-question").evaluateAll(questions => questions.map(question => (
    [...question.querySelectorAll(".quiz-choice span")].map(choice => choice.textContent.trim())
  )));
}
