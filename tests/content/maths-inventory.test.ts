import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import {
  loadCanonicalCorpus,
  DEFAULT_THRESHOLDS,
  MathsTemplateSchema,
} from "../../packages/content-schema/src/index.full";

const repoRoot = resolve(__dirname, "..", "..");

const ALL_STRANDS = [
  "number-to-10",
  "number-to-20",
  "number-to-100",
  "place-value",
  "addition-subtraction",
  "multiplication-division",
  "fractions",
  "measure",
  "time",
  "money",
  "shape-position",
  "pattern",
] as const;

describe("SLC-003-T004 — mathematics core (honest repair)", () => {
  it("loads at least the PRD minimum of 40 maths templates", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    expect(corpus.mathsTemplates.length).toBeGreaterThanOrEqual(
      DEFAULT_THRESHOLDS.minimumMathsTemplates,
    );
    expect(corpus.mathsTemplates.length).toBeGreaterThanOrEqual(40);
  });

  it("covers every Reception/Year 1 strand", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const covered = new Set(corpus.mathsTemplates.map((t) => t.strand));
    for (const strand of ALL_STRANDS) {
      expect(covered.has(strand), `missing strand ${strand}`).toBe(true);
    }
  });

  it("every template is schema-valid, not placeholder, and provisional", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    for (const template of corpus.mathsTemplates) {
      // Schema parse (catches missing recordVersion, bad enum, bad generator, etc.)
      const parsed = MathsTemplateSchema.safeParse(template);
      expect(parsed.success, `invalid template ${template.id}: ${JSON.stringify(parsed.error ?? "")}`).toBe(
        true,
      );
      // No fabricated/placeholder provenance.
      expect(template.licence.sourceUrl).not.toContain("example.org");
      expect(template.licence.licenceId).not.toContain("example.org");
      // Provisional: never claims approved human review.
      expect(template.reviewStatus === "draft" || template.reviewStatus === "in-review").toBe(
        true,
      );
      expect(template.reviewer).not.toMatch(/approved|reviewed-by-human/i);
      // Every template must carry at least one misconception tag.
      expect(template.misconceptionTags.length).toBeGreaterThan(0);
      // Every template must carry an exact answer key.
      expect((template.answerKey ?? "").length).toBeGreaterThan(0);
    }
  });

  it("every generator name is a safe lowercase slug", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    for (const template of corpus.mathsTemplates) {
      expect(template.generator).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("ids are unique", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const ids = corpus.mathsTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
