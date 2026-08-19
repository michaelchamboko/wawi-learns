import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..", "..");

describe("SLC-001-T001 — repository contract", () => {
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

  it("keeps the Vercel Git deployment configuration schema-compatible", () => {
    const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf-8")) as Record<string, unknown>;
    expect(vercel).not.toHaveProperty("rootDirectory");
  });

  it("uses Vercel Git integration as the only production deployer", () => {
    expect(existsSync(resolve(root, ".github/workflows/deploy-production.yml"))).toBe(false);
  });

  it("pins fake-indexeddb and links every workspace in the npm lockfile", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as {
      devDependencies?: Record<string, string>;
    };
    const lock = JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf-8")) as {
      packages?: Record<string, { link?: boolean; version?: string }>;
    };
    const workspaces = [
      "audio",
      "content-schema",
      "learning-engine",
      "local-data",
      "spike-local-data",
      "tracing",
      "ui",
    ];

    expect(pkg.devDependencies?.["fake-indexeddb"]).toBe("6.2.5");
    expect(lock.packages?.["node_modules/fake-indexeddb"]?.version).toBe("6.2.5");
    for (const workspace of workspaces) {
      expect(lock.packages?.[`node_modules/@wawi-learns/${workspace}`]?.link, `missing lockfile link for ${workspace}`).toBe(true);
    }
  });
});
