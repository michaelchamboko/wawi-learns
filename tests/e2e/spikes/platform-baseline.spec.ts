import { expect, test } from "@playwright/test";

test.describe("SLC-001-T001 — platform baseline", () => {
  test("serves the public version, build, and hosting identity contract", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "networkidle" });

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Wawi Learns");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");

    const shell = page.getByTestId("home-shell");
    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute("data-vercel-project", "wawi-learns");
    await expect(shell).toHaveAttribute("data-app-version", /\S+/);
    await expect(shell).toHaveAttribute("data-git-sha", /\S+/);

    const appVersion = await shell.getAttribute("data-app-version");
    const gitSha = await shell.getAttribute("data-git-sha");

    await expect(page.locator('meta[name="wawi:app-version"]')).toHaveAttribute(
      "content",
      appVersion ?? "",
    );
    await expect(page.locator('meta[name="wawi:git-sha"]')).toHaveAttribute(
      "content",
      gitSha ?? "",
    );
    await expect(page.locator('meta[name="wawi:vercel-project"]')).toHaveAttribute(
      "content",
      "wawi-learns",
    );
  });
});
