import { test, expect } from "./fixtures.js";
import { gotoApp, openQuiz } from "./helpers.js";

for (const width of [390, 768, 1280, 1440]) {
  test(`layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoApp(page);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await gotoApp(page, "#/unit/4/chapter/4-4/kp/572");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}

test("mobile Quiz modal remains readable and command targets are at least 44px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, "#/unit/1/chapter/1-1/kp/1");
  await openQuiz(page, "kp-1");

  const modalBounds = await page.locator(".quiz-dialog").boundingBox();
  expect(modalBounds).not.toBeNull();
  expect(modalBounds.x).toBeGreaterThanOrEqual(0);
  expect(modalBounds.x + modalBounds.width).toBeLessThanOrEqual(390);
  expect(modalBounds.y).toBeGreaterThanOrEqual(0);
  expect(modalBounds.y + modalBounds.height).toBeLessThanOrEqual(844);

  const undersized = await page.locator(
    ".button:not([hidden]), .icon-button:not([hidden]), .concept-toggle, .kp-label, .quiz-choice, .breadcrumbs a"
  ).evaluateAll(elements => elements.filter(element => {
    if (element.offsetParent === null) return false;
    const rect = element.getBoundingClientRect();
    return rect.width < 44 || rect.height < 44;
  }).map(element => ({ className: element.className, text: element.textContent.trim().slice(0, 50) })));
  expect(undersized).toEqual([]);
});

test("sticky controls do not cover a routed Knowledge Point", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoApp(page, "#/unit/4/chapter/4-4/kp/572");
  await expect.poll(() => page.evaluate(() => {
    const bar = document.querySelector(".app-bar").getBoundingClientRect();
    const target = document.querySelector("#kp-572").getBoundingClientRect();
    return Math.round(target.top - bar.bottom);
  })).toBeGreaterThanOrEqual(0);
});

test("Quiz focus is trapped, Escape closes it, and focus returns to the KP", async ({ page }) => {
  await gotoApp(page, "#/unit/1/chapter/1-1/kp/1");
  const trigger = await openQuiz(page, "kp-1");
  await expect(page.locator("#quizTitle")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#quizSubmit")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#quizTitle")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#quizModal")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("key controls have accessible names", async ({ page }) => {
  await gotoApp(page, "#/unit/1/chapter/1-1/kp/1");
  await expect(page.locator("#searchBox")).toHaveAccessibleName("Search the full checklist");
  await expect(page.locator("#resetProgress")).toHaveAccessibleName("Reset progress");
  await openQuiz(page, "kp-1");
  await expect(page.locator("#quizClose")).toHaveAccessibleName("Close quiz");
  await expect(page.locator("#quizModal")).toHaveAccessibleName(/KP1: DNA as genetic material/);
});

test("MathJax renders Chapter formulas", async ({ page }) => {
  await gotoApp(page, "#/unit/1/chapter/1-1/kp/8");
  await expect.poll(() => page.locator("#kp-8 mjx-container").count(), { timeout: 20_000 }).toBeGreaterThan(0);
});
