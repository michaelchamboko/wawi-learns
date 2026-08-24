import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
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

  it("GitHub Actions workflow declares required jobs and the main branch trigger", () => {
    const workflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf-8");
    expect(workflow).toMatch(/branches:\s*\[main\]/);
    expect(workflow).toMatch(/runs-on:\s*ubuntu-latest/);
    expect(workflow).toMatch(/node-version:\s*24\.x/);
    expect(workflow).toMatch(/npm ci/);
    expect(workflow).toMatch(/npm run lint/);
    expect(workflow).toMatch(/npm run typecheck/);
    expect(workflow).toMatch(/npm run build/);
    expect(workflow).toMatch(/test:e2e/);
  });

  it("renders the public deployment identity from the shared Vercel-aware helper", () => {
    const page = readFileSync(resolve(root, "app/page.tsx"), "utf-8");
    const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf-8");

    expect(page).toContain('readDeploymentIdentity');
    expect(layout).toContain('readDeploymentIdentity');
    expect(page).not.toContain('NEXT_PUBLIC_GIT_SHA');
    expect(layout).not.toContain('NEXT_PUBLIC_GIT_SHA');
  });
});
