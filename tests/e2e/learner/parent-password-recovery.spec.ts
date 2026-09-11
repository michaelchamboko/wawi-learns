import { expect, test } from "@playwright/test";

test("offers a recoverable signup error and carries the email into password recovery", async ({ page }) => {
  const requests: Array<Record<string, string>> = [];
  await page.routeWebSocket("**/api/**/sync", (socket) => socket.onMessage((message) => {
    const body = JSON.parse(String(message));
    if (body.type !== "Action") return;
    const params = body.args[0].params;
    requests.push(params);
    socket.send(JSON.stringify({ type: "ActionResponse", requestId: body.requestId, logLines: [], ...(params.flow === "signUp"
      ? { success: false, result: "Server Error", errorData: "ACCOUNT_EXISTS" }
      : { success: true, result: { tokens: null } }) }));
  }));
  await page.goto("/home");
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("parent@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByTestId("parent-auth").getByRole("alert")).toContainText("already exists");
  await expect(page.getByTestId("parent-auth").getByRole("alert")).not.toContainText("Server Error");
  await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("parent@example.com");
  await expect(page.getByTestId("parent-auth").getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Send reset code", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("If an account exists");
  await page.getByLabel("Reset code", { exact: true }).fill("12345678");
  await page.getByLabel("New password", { exact: true }).fill("new-password");
  await page.getByLabel("Confirm new password", { exact: true }).fill("different-password");
  await page.getByRole("button", { name: "Reset password and sign in" }).click();
  await expect(page.getByTestId("parent-auth").getByRole("alert")).toContainText("don't match");
  expect(requests).toHaveLength(2);
  await page.getByLabel("Confirm new password", { exact: true }).fill("new-password");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("New password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Reset password and sign in" }).click();
  await expect(page.getByRole("status")).toContainText("Password updated");
  expect(requests[2]).toEqual({ email: "parent@example.com", flow: "reset-verification", code: "12345678", newPassword: "new-password" });
});

test("keeps delivery errors actionable and does not claim to send a code", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.routeWebSocket("**/api/**/sync", (socket) => socket.onMessage((message) => {
    const body = JSON.parse(String(message));
    if (body.type === "Action") socket.send(JSON.stringify({ type: "ActionResponse", requestId: body.requestId, logLines: [], success: false, result: "Server Error", errorData: "RESET_EMAIL_UNAVAILABLE" }));
  }));
  await page.goto("/home");
  await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("parent@example.com");
  await page.getByRole("button", { name: "Send reset code", exact: true }).click();
  await expect(page.getByTestId("parent-auth").getByRole("alert")).toContainText("couldn't send a reset code");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset code", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
