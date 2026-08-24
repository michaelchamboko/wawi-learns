import { expect, test } from "@playwright/test";

test.describe("SLC-011 — private-beta MVP", () => {
  test("keeps the public entry generic and sends parents to the protected learner route", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.getByTestId("home-shell")).toBeVisible();
    await expect(page.getByText("Malachi", { exact: false })).toHaveCount(0);
    await page.getByRole("link", { name: "Parent sign in" }).click();
    await expect(page).toHaveURL(/\/home$/);

    if (process.env.NEXT_PUBLIC_CONVEX_URL) {
      await expect(page.getByTestId("parent-auth")).toBeVisible();
    } else {
      await expect(page.getByTestId("parent-setup-required")).toBeVisible();
    }
  });
});
