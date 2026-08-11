import { describe, expect, it } from "vitest";
import { z } from "zod";

const ADRS = [
  ["ADR-005-ai-and-safety-providers.md", "SLC-001-T005"],
  ["ADR-006-content-licensing.md", "SLC-001-T005"],
  ["ADR-007-offline-packaging.md", "SLC-001-T002"],
] as const;

const ADR_STATUS = z.enum(["proposed", "accepted", "rejected"]);

const adrFrontmatterSchema = z.object({
  status: ADR_STATUS,
  owner_slice: z.string(),
  acceptance: z.string(),
});

const parseFrontmatter = (body: string): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const line of body.split(/\r?\n/)) {
    const match = /^- \*\*([^*]+):\*\*\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const key = match[1].trim().toLowerCase().replace(/\s+/g, "_");
    map[key] = match[2].trim();
  }
  return map;
};

describe("SLC-001-T005 — ADR rubric for AI, licensing, packaging", () => {
  for (const [adr, ownerSlice] of ADRS) {
    it(`${adr} has accepted status and references its owning slice`, async () => {
      const fs = await import("node:fs/promises");
      const body = await fs.readFile(`docs/decisions/${adr}`, "utf-8");
      const fm = parseFrontmatter(body);
      const parsed = adrFrontmatterSchema.parse({
        status: fm.status,
        owner_slice: fm["owner_slice"],
        acceptance: fm.acceptance,
      });
      expect(parsed.status).toBe("accepted");
      expect(parsed.owner_slice).toContain(ownerSlice);
    });
  }

  it("ADR-005 selects OpenRouter with logging and training disabled", async () => {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile("docs/decisions/ADR-005-ai-and-safety-providers.md", "utf-8");
    expect(body).toMatch(/OpenRouter/);
    expect(body).toMatch(/logging.*off|logging.*disabled|no logging/i);
    expect(body).toMatch(/training.*off|training.*disabled|train.*opt.*out/i);
    expect(body).toMatch(/circuit breaker|monthly cap/i);
  });

  it("ADR-006 enforces CC0 or commercial licence and rejects share-alike", async () => {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile("docs/decisions/ADR-006-content-licensing.md", "utf-8");
    expect(body).toMatch(/CC0 1.0/);
    expect(body).toMatch(/commercial perpetual licence|commercial/i);
    expect(body).toMatch(/share-alike|CC-BY-SA/);
    // Manifest requires licence, licence_id, source_url, proof_path fields.
    expect(body).toMatch(/licence/);
    expect(body).toMatch(/licence_id/);
    expect(body).toMatch(/source_url/);
    expect(body).toMatch(/proof_path/);
  });

  it("ADR-007 acceptance: allowed scope, atomic activation, never private in shared cache", async () => {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile("docs/decisions/ADR-007-offline-packaging.md", "utf-8");
    expect(body).toMatch(/precaches|precacheEntries/);
    expect(body).toMatch(/NetworkOnly/i);
    expect(body).toMatch(/skipWaiting.*opt-in|SKIP_WAITING.*message/);
    expect(body).toMatch(/clientsClaim: true/);
    expect(body).toMatch(/Serwist.fallbacks|navigation fallbacks/i);
  });
});