import { defineConfig, devices } from "@playwright/test";
import { execFileSync } from "node:child_process";

const PORT = Number(process.env.PWA_E2E_PORT ?? 3100);
const gitSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const buildGitSha = process.env.NEXT_PUBLIC_GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? gitSha;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "playwright-report/pwa-update.json" }]],
  use: {
    baseURL: process.env.PWA_E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "production",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.PWA_E2E_BASE_URL ?? "https://wawi-learns.vercel.app",
      },
      testMatch: /release\/(production-smoke|rollback)\.spec\.ts/,
    },
  ],
  webServer: process.env.PWA_E2E_NO_SERVER
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        env: { ...process.env, NEXT_PUBLIC_GIT_SHA: buildGitSha },
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
