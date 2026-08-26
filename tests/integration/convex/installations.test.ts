import { describe, expect, it } from "vitest";
import { installationSnapshotFor } from "../../../convex/installations";

describe("SLC-002-T005 — installation snapshot contract", () => {
  it("returns only opaque ownership, pack, issuance, and revocation fields", () => {
    const snapshot = installationSnapshotFor("parent-1", "child-1", "install-1", 1_700_000_000_000);
    expect(snapshot).toEqual({
      parentId: "parent-1",
      childProfileId: "child-1",
      installationId: "install-1",
      packVersion: "1.0.0",
      packDigest: "fd40e9000dd033b90b3a7c61fab091220d5ce96e496e1471cc681f1947deb352",
      issuedAt: 1_700_000_000_000,
    });
    expect(JSON.stringify(snapshot)).not.toMatch(/email|token|credential|displayName|content/i);
  });
});
