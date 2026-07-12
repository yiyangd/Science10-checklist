import { test, expect } from "./fixtures.js";
import { gotoApp, openQuiz } from "./helpers.js";

const boundaryRoutes = [
  ["kp-1", "#/unit/1/chapter/1-1/kp/1"],
  ["kp-161", "#/unit/1/chapter/1-4/kp/161"],
  ["kp-162", "#/unit/2/chapter/2-1/kp/162"],
  ["kp-305", "#/unit/2/chapter/2-4/kp/305"],
  ["kp-306", "#/unit/3/chapter/3-1/kp/306"],
  ["kp-452", "#/unit/3/chapter/3-4/kp/452"],
  ["kp-453", "#/unit/4/chapter/4-1/kp/453"],
  ["kp-572", "#/unit/4/chapter/4-4/kp/572"]
];

test("home, Unit, and Chapter views preserve the hierarchy", async ({ page }) => {
  await gotoApp(page);
  await expect(page.locator(".course-card")).toHaveCount(4);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".kp-item")).toHaveCount(0);

  await page.locator('.card-grid a[href="#/unit/1"]').click();
  await expect(page.locator(".course-card")).toHaveCount(4);
  await expect(page.locator(".kp-item")).toHaveCount(0);

  await page.locator('.card-grid a[href="#/unit/1/chapter/1-1"]').click();
  await expect(page.locator(".kp-item")).toHaveCount(39);
  await expect(page.locator(".kp-item").first()).toHaveAttribute("id", "kp-1");
  await expect(page.locator(".kp-item").last()).toHaveAttribute("id", "kp-39");
});

test("Chapter 4.4 contains the final 31 Knowledge Points", async ({ page }) => {
  await gotoApp(page, "#/unit/4/chapter/4-4");
  await expect(page.locator(".kp-item")).toHaveCount(31);
  await expect(page.locator(".kp-item").first()).toHaveAttribute("id", "kp-542");
  await expect(page.locator(".kp-item").last()).toHaveAttribute("id", "kp-572");
});

test("all Unit boundary Knowledge Points resolve and open a Quiz", async ({ page }) => {
  for (const [kpId, route] of boundaryRoutes) {
    await test.step(kpId, async () => {
      await gotoApp(page, route);
      await expect(page.locator(`#${kpId}`)).toBeVisible();
      await openQuiz(page, kpId);
      await expect(page.locator("#quizForm fieldset")).toHaveCount(3);
      await expect(page.locator('#quizForm input[type="radio"]')).toHaveCount(12);
      await page.locator("#quizClose").click();
    });
  }
});

test("browser Back and Forward preserve hierarchical navigation", async ({ page }) => {
  await gotoApp(page);
  await page.locator('.card-grid a[href="#/unit/1"]').click();
  await expect(page).toHaveURL(/#\/unit\/1$/);
  await page.locator('.card-grid a[href="#/unit/1/chapter/1-1"]').click();
  await expect(page).toHaveURL(/#\/unit\/1\/chapter\/1-1$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/unit\/1$/);
  await page.goForward();
  await expect(page).toHaveURL(/#\/unit\/1\/chapter\/1-1$/);
});

test("legacy hashes and the old v2 filename resolve to canonical routes", async ({ page }) => {
  await page.goto("/#unit-1");
  await expect(page).toHaveURL(/#\/unit\/1$/);
  await page.goto("/#chapter-1-1");
  await expect(page).toHaveURL(/#\/unit\/1\/chapter\/1-1$/);
  await page.goto("/#kp-572");
  await expect(page).toHaveURL(/#\/unit\/4\/chapter\/4-4\/kp\/572$/);

  await page.goto("/BCScienceConnections10_Full_Course_Master_Knowledge_Point_Checklist_Interactive_v2.html#kp-572");
  await expect(page).toHaveURL(/\/#\/unit\/4\/chapter\/4-4\/kp\/572$/);
  await expect(page.locator("#kp-572")).toBeVisible();
});
