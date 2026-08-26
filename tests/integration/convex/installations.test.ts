import { describe, expect, it } from "vitest";
import { installationSnapshotFor } from "../../../convex/installations";
import { ESSENTIAL_PACK_DIGEST } from "../../../packages/local-data/src/essential-pack";

describe("SLC-002-T005 — installation snapshot contract", () => {
  it("returns only opaque ownership, pack, issuance, and revocation fields", () => {
    const snapshot = installationSnapshotFor("parent-1", "child-1", "install-1", 1_700_000_000_000);
    expect(snapshot).toEqual({
      parentId: "parent-1",
      childProfileId: "child-1",
      installationId: "install-1",
      packVersion: "1.0.0",
      packDigest: ESSENTIAL_PACK_DIGEST,
      issuedAt: 1_700_000_000_000,
    });
    expect(JSON.stringify(snapshot)).not.toMatch(/email|token|credential|displayName|content/i);
  });
});
