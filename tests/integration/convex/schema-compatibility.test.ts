import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(resolve(__dirname, "../../../convex/schema.ts"), "utf-8");

describe("SLC-002-T002 — Convex schema compatibility", () => {
  it("retains parent ownership and installation indexes required by guarded functions", () => {
    expect(schema).toMatch(/parents:\s*defineTable\(\{[\s\S]*userId:\s*v\.string\(\)/);
    expect(schema).toMatch(/childProfiles:\s*defineTable\(\{[\s\S]*parentId:\s*v\.id\("parents"\)/);
    expect(schema).toMatch(/installations:\s*defineTable\(\{[\s\S]*parentId:\s*v\.id\("parents"\)/);
    expect(schema).toMatch(/\.index\("byInstallation", \["installationId"\]\)/);
    expect(schema).toMatch(/\.index\("byParent", \["parentId"\]\)/);
    expect(schema).toMatch(/attempts:\s*defineTable\(\{[\s\S]*eventId:\s*v\.string\(\)/);
    expect(schema).toMatch(/\.index\("byEventId", \["eventId"\]\)/);
  });
});
