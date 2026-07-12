import { test as base, expect } from "@playwright/test";

const localOrigin = new URL(process.env.E2E_BASE_URL || "http://127.0.0.1:4173").origin;

export const test = base.extend({
  page: async ({ page }, use) => {
    const runtimeIssues = [];

    page.on("console", message => {
      if (message.type() === "error") runtimeIssues.push(`Console: ${message.text()}`);
    });
    page.on("pageerror", error => runtimeIssues.push(`Page error: ${error.message}`));
    page.on("requestfailed", request => {
      if (request.url().startsWith(localOrigin)) {
        runtimeIssues.push(`Request failed: ${request.method()} ${request.url()} (${request.failure()?.errorText || "unknown"})`);
      }
    });
    page.on("response", response => {
      if (response.url().startsWith(localOrigin) && response.status() >= 400) {
        runtimeIssues.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    await use(page);
    expect.soft(runtimeIssues, "Browser runtime should have no Console errors or failed local assets").toEqual([]);
  }
});

export { expect };
