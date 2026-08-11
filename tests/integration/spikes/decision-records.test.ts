import { describe, expect, it } from "vitest";
import { z } from "zod";

const ADRS = [
  "ADR-001-identity-provider.md",
  "ADR-002-local-sync.md",
  "ADR-003-speech-and-tts.md",
  "ADR-004-tracing-renderer.md",
] as const;

const ADR_STATUS = z.enum(["proposed", "accepted", "rejected"]);

const adrFrontmatterSchema = z.object({
  status: ADR_STATUS,
  owner_slice: z.string().regex(/^SLC-\d{3}-T\d{3}$/),
  acceptance: z.string(),
  supersedes: z.string().optional(),
});

const parseFrontmatter = (body: string): Record<string, string> => {
  const map: Record<string, string> = {};
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const match = /^- \*\*([^*]+):\*\*\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const key = match[1].trim().toLowerCase().replace(/\s+/g, "_");
    map[key] = match[2].trim();
  }
  return map;
};

describe("SLC-001-T004 — ADR rubric for identity, speech and tracing", () => {
  for (const adr of ADRS) {
    it(`${adr} has accepted status, owner slice and acceptance id`, async () => {
      const fs = await import("node:fs/promises");
      const path = `docs/decisions/${adr}`;
      const body = await fs.readFile(path, "utf-8");
      const fm = parseFrontmatter(body);
      const parsed = adrFrontmatterSchema.parse({
        status: fm.status,
        owner_slice: fm["owner_slice"],
        acceptance: fm.acceptance,
      });
      expect(parsed.status).toBe("accepted");
    });
  }

  it("ADR-001 selects Convex Auth and forbids any third-party IdP", async () => {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile("docs/decisions/ADR-001-identity-provider.md", "utf-8");
    expect(body).toMatch(/Convex Auth/i);
    expect(body).toMatch(/requireRecentVerification/i);
    expect(body).not.toMatch(/^## Selected: Clerk/m);
  });

  it("ADR-003 enforces raw-audio no-retention and layered fallback", async () => {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile("docs/decisions/ADR-003-speech-and-tts.md", "utf-8");
    expect(body).toMatch(/Reviewed `en-GB` recorded clips/);
    expect(body).toMatch(/Azure Speech/);
    expect(body).toMatch(/Web Speech API|speechSynthesis/);
    expect(body).toMatch(/logging.*disabled|no logging/i);
    expect(body).toMatch(/retention.*disabled|zero-data-retention/i);
  });

  it("ADR-004 selects a custom in-repo tracer and forbids external libraries", async () => {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile("docs/decisions/ADR-004-tracing-renderer.md", "utf-8");
    expect(body).toMatch(/custom perfect-freehand pointer-event tracer/);
    expect(body).toMatch(/no third-party tracing library|no off-the-shelf library/i);
    expect(body).toMatch(/scoreTrace/);
  });
});