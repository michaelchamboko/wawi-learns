import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..", "..");

describe("SLC-002-T001 — repository contract", () => {
  it("declares npm workspaces and the required scripts", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as {
      workspaces?: string[];
      scripts?: Record<string, string>;
    };
    expect(pkg.workspaces).toEqual(["packages/*"]);
    const required = ["check", "test:unit", "test:integration", "test:e2e", "build", "lint", "typecheck"];
    for (const name of required) {
      expect(pkg.scripts?.[name], `missing script ${name}`).toBeTypeOf("string");
    }
    expect(pkg.scripts?.["test:content"]).toBeTypeOf("string");
    expect(pkg.scripts?.["test:offline"]).toBeTypeOf("string");
    expect(pkg.scripts?.["test:security"]).toBeTypeOf("string");
  });

  it("creates every PRD §33.3 package root", () => {
    const packages = [
      "packages/local-data",
      "packages/learning-engine",
      "packages/content-schema",
      "packages/ui",
      "packages/tracing",
      "packages/audio",
    ];
    for (const pkg of packages) {
      expect(existsSync(resolve(root, pkg, "package.json")), `missing ${pkg}`).toBe(true);
    }
  });

  it("pins Node 24.x and refuses any alternate package manager", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as {
      engines?: { node?: string };
      packageManager?: string;
    };
    expect(pkg.engines?.node).toMatch(/>=24 <25/);
    expect(pkg.packageManager).toBeUndefined();
  });

  it("GitHub Actions workflows use GitHub-hosted runners", () => {
    const workflowDirectory = resolve(root, ".github/workflows");
    const workflows = readdirSync(workflowDirectory)
      .filter((name) => /\.ya?ml$/i.test(name))
      .map((name) => ({ name, content: readFileSync(resolve(workflowDirectory, name), "utf-8") }));

    expect(workflows.map(({ name }) => name)).toContain("ci.yml");

    for (const { name, content } of workflows) {
      const runnerSelections = Array.from(
        content.matchAll(/^\s*runs-on:\s*(.+)$/gm),
        ([, value]) => value.trim(),
      );
      expect(runnerSelections, `${name} has no CI jobs`).not.toHaveLength(0);
      expect(runnerSelections, `${name} selects a non-GitHub-hosted runner`).toEqual(
        Array(runnerSelections.length).fill("ubuntu-latest"),
      );
      expect(content, `${name} still targets a self-hosted runner`).not.toMatch(/self-hosted/);
    }

    const ciWorkflow = workflows.find(({ name }) => name === "ci.yml")?.content ?? "";
    expect(ciWorkflow).toMatch(/branches:\s*\[main\]/);
    expect(ciWorkflow).toMatch(/^\s*pull_request\s*:/m);
    expect(ciWorkflow).toMatch(/node-version:\s*24\.x/);
    expect(ciWorkflow).toMatch(/npm ci/);
    expect(ciWorkflow).toMatch(/npm run lint/);
    expect(ciWorkflow).toMatch(/npm run typecheck/);
    expect(ciWorkflow).toMatch(/npm run build/);
    expect(ciWorkflow).toMatch(/test:e2e/);
  });

  it("renders the public deployment identity from the shared Vercel-aware helper", () => {
    const page = readFileSync(resolve(root, "app/page.tsx"), "utf-8");
    const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf-8");

    expect(page).toContain('readDeploymentIdentity');
    expect(layout).toContain('readDeploymentIdentity');
    expect(page).not.toContain('NEXT_PUBLIC_GIT_SHA');
    expect(layout).not.toContain('NEXT_PUBLIC_GIT_SHA');
  });

  it("deploys Convex backend and Next.js frontend in the Vercel build command", () => {
    const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf-8")) as {
      buildCommand?: string;
    };
    expect(vercel.buildCommand).toBe("npx convex deploy --cmd 'npm run build'");
  });
});
