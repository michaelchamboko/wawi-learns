import { describe, expect, it } from "vitest";
import {
  ContentPackManifestSchema,
  activateValidatedPack,
  type ContentPackManifest,
} from "../../../packages/local-data/src/index";

const manifest: ContentPackManifest = {
  packVersion: "1.0.0",
  curriculumVersion: "curriculum-1",
  engineVersion: "engine-1",
  issuedAt: 1_700_000_000_000,
  assets: [{
    url: "/content/index.json",
    sha256: "0".repeat(64),
    bytes: 4,
    contentType: "application/json",
  }],
  entryUrls: ["/content/index.json"],
  sizeBytes: 4,
};

describe("SLC-001-T005 — packaging spike", () => {
  it("accepts the immutable local-data pack manifest shape", () => {
    expect(ContentPackManifestSchema.safeParse(manifest).success).toBe(true);
  });

  it("keeps the previous pack active when a candidate hash fails", async () => {
    const result = await activateValidatedPack(manifest, {
      fetchFile: async () => new TextEncoder().encode("pack").buffer,
      previousPackVersion: "0.9.0",
    });

    expect(result).toMatchObject({
      status: "rejected",
      previousPackVersion: "0.9.0",
      activePackVersion: "0.9.0",
    });
  });
});
