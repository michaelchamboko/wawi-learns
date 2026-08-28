import { describe, expect, it } from "vitest";
import {
  pinSessionVersions,
  type SessionVersionSet,
} from "../../../packages/learning-engine/src/version-pin";

const baseSnapshot: SessionVersionSet = {
  shellRevision: "shell-v1",
  engineVersion: "engine-1",
  packVersion: "0.1.0",
  schemaVersion: "1.0.0",
  overlayRevision: null,
};

describe("SLC-009-T001 — versioned offline activation", () => {
  it("accepts the canonical version snapshot", () => {
    const result = pinSessionVersions({ snapshot: baseSnapshot });
    expect(result.ok).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("rejects an unknown shell revision", () => {
    const result = pinSessionVersions({ snapshot: { ...baseSnapshot, shellRevision: "shell-v2" } });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("unknown-shell-revision");
  });

  it("rejects an incompatible engine version", () => {
    const result = pinSessionVersions({ snapshot: { ...baseSnapshot, engineVersion: "engine-99" } });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("incompatible-engine");
  });

  it("rejects an incompatible pack version", () => {
    const result = pinSessionVersions({ snapshot: { ...baseSnapshot, packVersion: "0.2.0" } });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("incompatible-pack");
  });

  it("rejects a schema version that has been rolled forward", () => {
    const result = pinSessionVersions({ snapshot: { ...baseSnapshot, schemaVersion: "1.1.0" } });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("incompatible-schema");
  });

  it("honours a custom compatibility graph for rollouts", () => {
    const result = pinSessionVersions({
      snapshot: { ...baseSnapshot, engineVersion: "engine-2", packVersion: "0.2.0" },
      graph: [
        {
          shellRevision: "shell-v1",
          acceptedEngineVersions: ["engine-1", "engine-2"],
          acceptedPackVersions: ["0.1.0", "0.2.0"],
          acceptedSchemaVersions: ["1.0.0", "1.1.0"],
        },
      ],
    });
    expect(result.ok).toBe(true);
  });
});
