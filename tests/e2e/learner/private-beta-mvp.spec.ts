import { expect, test } from "@playwright/test";

const authStoragePath = process.env.WAWI_E2E_AUTH_STORAGE;
if (process.env.WAWI_E2E_REQUIRE_AUTH === "1" && !authStoragePath) {
  throw new Error("WAWI_E2E_REQUIRE_AUTH=1 requires WAWI_E2E_AUTH_STORAGE");
}

const attemptCount = async (page: import("@playwright/test").Page): Promise<number> =>
  page.evaluate(async () => {
    const databases = await indexedDB.databases();
    if (!databases.some((database) => database.name === "wawi-private-beta")) return 0;
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("wawi-private-beta");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!database.objectStoreNames.contains("attempts")) {
      database.close();
      return 0;
    }
    const count = await new Promise<number>((resolve, reject) => {
      const request = database.transaction("attempts", "readonly").objectStore("attempts").count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return count;
  });

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

  test("completes the authenticated five-step learner journey with offline persistence", async ({ browser }) => {
    test.skip(!authStoragePath, "WAWI_E2E_AUTH_STORAGE is required for the authenticated journey");
    const context = await browser.newContext({ storageState: authStoragePath });
    try {
      const page = await context.newPage();
      await page.goto("/home", { waitUntil: "networkidle" });

      if (await page.getByRole("heading", { name: "Who is learning today?" }).isVisible().catch(() => false)) {
        await page.getByLabel("Child's first name").fill("Test learner");
        await page.getByRole("button", { name: "Start the adventure" }).click();
      }
      await expect(page.getByTestId("child-home")).toBeVisible();
      await page.getByRole("button", { name: /Continue My Adventure/ }).click();
      await expect(page.getByText("Activity 1 of 5")).toBeVisible();
      await expect(page.getByText(/Meet the cat/)).toBeVisible();
      await page.getByRole("button", { name: "Hear cat" }).click();
      await page.getByRole("button", { name: "Help me" }).click();
      await page.getByRole("button", { name: "I'm ready" }).click();
      expect(await attemptCount(page)).toBeGreaterThan(0);
      await page.getByRole("button", { name: "Next step" }).click();

      await context.setOffline(true);
      await expect(page.getByText("Activity 2 of 5")).toBeVisible();
      await page.getByRole("button", { name: "sun", exact: true }).click();
      await expect(page.getByRole("status")).toContainText("Lovely work");
      await expect(page.getByText(/Saved here|sync when you’re back online/i)).toBeVisible();
      await page.getByRole("button", { name: "Next step" }).click();

      await context.setOffline(false);
      await expect(page.getByText("Activity 3 of 5")).toBeVisible();
      await page.getByRole("button", { name: "sit", exact: true }).click();
      await page.getByRole("button", { name: "Next step" }).click();
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.getByText("Activity 4 of 5")).toBeVisible();

      await page.getByRole("button", { name: "s", exact: true }).click();
      await page.getByRole("button", { name: "a", exact: true }).click();
      await page.getByRole("button", { name: "t", exact: true }).click();
      await page.getByRole("button", { name: "Next step" }).click();
      await expect(page.getByText("Activity 5 of 5")).toBeVisible();
      await page.getByRole("button", { name: "can", exact: true }).click();
      await page.getByRole("button", { name: "Finish adventure" }).click();
      await expect(page.getByText("Adventure complete")).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
