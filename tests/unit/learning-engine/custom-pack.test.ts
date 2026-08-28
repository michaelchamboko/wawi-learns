import { describe, expect, it } from "vitest";
import {
  approveCustomPackRevision,
  buildCustomPackDraft,
  editCustomPackDraft,
  overlayExposesDraft,
  validateAndStampDraft,
  withdrawCustomPackDraft,
  type CustomPackDraft,
} from "../../../packages/learning-engine/src/index";

const NOW = 1_700_000_000_000;

const validItems = ["find the cat", "say the rhyme", "spot the moon"];

const makeDraft = (overrides: Partial<Parameters<typeof buildCustomPackDraft>[0]> = {}): CustomPackDraft =>
  buildCustomPackDraft({
    id: "pack-1",
    ownerParentId: "parent-1",
    childProfileId: "child-1",
    theme: "garden adventure",
    items: validItems,
    now: NOW,
    ...overrides,
  });

describe("SLC-008-T004 — custom pack and assisted activities", () => {
  it("validates a clean draft, stamps a revision id, and exposes only after approval", () => {
    const draft = makeDraft();
    const { draft: stamped, validation } = validateAndStampDraft(draft, NOW + 1);
    expect(validation.ok).toBe(true);
    expect(stamped.status).toBe("validated");
    expect(stamped.revisionId).toBe(`rev-pack-1-${NOW + 1}`);
    expect(overlayExposesDraft(stamped)).toBe(false);
    const approved = approveCustomPackRevision(stamped, stamped.revisionId!, NOW + 2);
    expect(approved.status).toBe("approved");
    expect(overlayExposesDraft(approved)).toBe(true);
  });

  it("rejects prompts that ask for personal information and never approves them", () => {
    const draft = makeDraft({ items: ["hi", "share my address please"] });
    const { draft: stamped, validation } = validateAndStampDraft(draft, NOW);
    expect(validation.ok).toBe(false);
    expect(validation.errors.join("|")).toMatch(/forbidden/);
    expect(stamped.status).toBe("draft");
    expect(stamped.revisionId).toBeNull();
  });

  it("reject theme tokens and oversize items", () => {
    const tooLong = "x".repeat(120);
    const draft = makeDraft({ theme: "buy at https://store.example.com", items: [tooLong] });
    const { validation } = validateAndStampDraft(draft);
    expect(validation.ok).toBe(false);
    expect(validation.errors.some((e) => e.startsWith("theme-forbidden"))).toBe(true);
    expect(validation.errors.some((e) => e.startsWith("item-1-too-long"))).toBe(true);
  });

  it("editing an approved draft invalidates the revision and hides from overlay", () => {
    const { draft: stamped } = validateAndStampDraft(makeDraft(), NOW);
    const approved = approveCustomPackRevision(stamped, stamped.revisionId!, NOW + 2);
    const edited = editCustomPackDraft(approved, ["updated item"], NOW + 3);
    expect(edited.status).toBe("edited");
    expect(edited.revisionId).toBeNull();
    expect(overlayExposesDraft(edited)).toBe(false);
  });

  it("approving a mismatched revision id throws and never flips the status", () => {
    const { draft: stamped } = validateAndStampDraft(makeDraft(), NOW);
    expect(() => approveCustomPackRevision(stamped, "rev-mismatch", NOW + 2)).toThrow(/revision-mismatch/);
    expect(stamped.status).toBe("validated");
  });

  it("withdraw removes the pack from the overlay without losing its history", () => {
    const { draft: stamped } = validateAndStampDraft(makeDraft(), NOW);
    const approved = approveCustomPackRevision(stamped, stamped.revisionId!, NOW + 2);
    const withdrawn = withdrawCustomPackDraft(approved, NOW + 3);
    expect(withdrawn.status).toBe("withdrawn");
    expect(overlayExposesDraft(withdrawn)).toBe(false);
  });
});
