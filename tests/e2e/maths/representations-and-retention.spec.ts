import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const RECEPTION = `${BASE_URL}/home/reception-harness`;
const YEAR_ONE = `${BASE_URL}/home/year-one-harness`;

test.describe("SLC-007-T004 — maths representations and retention", () => {
  test("the reception harness cycles through concrete, pictorial and abstract representations", async ({ page, context }) => {
    await page.goto(RECEPTION, { waitUntil: "networkidle" });
    const supports = new Set<string>();
    for (let i = 0; i < 4; i += 1) {
      const card = page.getByTestId("reception-maths-card");
      await expect(card).toBeVisible();
      const supportText = (await page.getByTestId("support-strategy").textContent()) ?? "";
      supportText
        .split("·")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => supports.add(s));
      await page.getByRole("button", { name: "I got it" }).click();
    }
    await expect(supports.has("worked-example")).toBe(true);
    await expect(supports.has("delayed-recall")).toBe(true);
    await context.close();
  });

  test("the year one harness advances without a speed penalty and stays usable", async ({ page, context }) => {
    await page.goto(YEAR_ONE, { waitUntil: "networkidle" });
    const card = page.getByTestId("year-one-maths-card");
    await expect(card).toBeVisible();
    const message = await page.locator("p", { hasText: "Accuracy and understanding matter more than speed." }).textContent();
    expect(message).toContain("speed");
    await page.getByRole("button", { name: "I got it" }).click();
    await expect(page.getByTestId("year-one-maths-progress")).not.toContainText("Activity 1 of");
    await context.close();
  });

  test("maths evidence keeps English strands untouched", async ({ page, context }) => {
    await page.goto(RECEPTION, { waitUntil: "networkidle" });
    const support = await page.getByTestId("support-strategy").textContent();
    expect(support).not.toMatch(/phonics|spelling|reading/);
    await context.close();
  });
});
