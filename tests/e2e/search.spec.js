import { test, expect } from "./fixtures.js";
import { gotoApp } from "./helpers.js";

const searches = [
  ["natural selection", "#/unit/1/chapter/1-3/kp/87", "kp-87"],
  ["neutralization", "#/unit/2/chapter/2-4/kp/289", "kp-289"],
  ["kinetic energy", "#/unit/3/chapter/3-1/kp/311", "kp-311"],
  ["redshift", "#/unit/4/chapter/4-4/kp/545", "kp-545"]
];

for (const [query, route, kpId] of searches) {
  test(`global search navigates ${query} to the expected Knowledge Point`, async ({ page }) => {
    await gotoApp(page);
    const search = page.getByRole("searchbox", { name: "Search the full checklist" });
    await search.fill(query);
    const result = page.locator(`.search-result[href="${route}"]`);
    await expect(result).toBeVisible();
    await result.click();
    await expect(page).toHaveURL(new RegExp(`${route.replaceAll("/", "\\/")}$`));
    await expect(page.locator(`#${kpId}`)).toBeVisible();
  });
}

test("clearing search restores the normal Home view", async ({ page }) => {
  await gotoApp(page);
  const search = page.getByRole("searchbox", { name: "Search the full checklist" });
  await search.fill("redshift");
  await expect(page.locator("#searchPanel")).toBeVisible();
  await search.fill("");
  await expect(page.locator("#searchPanel")).toBeHidden();
  await expect(page.locator(".course-card")).toHaveCount(4);
});
