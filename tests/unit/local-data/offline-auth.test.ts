import { describe, expect, it } from "vitest";
import {
  canOpenChildModeOffline,
  type InstallationSnapshot,
} from "../../../packages/local-data/src/offline-auth";

const NOW = 1_700_000_000_000;
const snapshot = (overrides: Partial<InstallationSnapshot> = {}): InstallationSnapshot => ({
  installationId: "install-a",
  parentId: "parent-1",
  childProfileId: "child-1",
  packVersion: "1.0.0",
  packDigest: "a".repeat(64),
  issuedAt: NOW - 1000,
  ...overrides,
});

describe("SLC-002-T005 — offline authorisation", () => {
  it("opens child mode when the snapshot is valid", () => {
    const decision = canOpenChildModeOffline({
      now: () => NOW,
      snapshot: snapshot(),
      requestedMode: "child",
    });
    expect(decision.mode).toBe("child");
    expect(decision.reason).toBe("snapshot-valid");
  });

  it("denies child mode when no snapshot exists", () => {
    const decision = canOpenChildModeOffline({
      now: () => NOW,
      snapshot: null,
      requestedMode: "child",
    });
    expect(decision.mode).toBe("denied");
    expect(decision.reason).toBe("no-snapshot");
  });

  it("denies child mode when the snapshot has been revoked", () => {
    const decision = canOpenChildModeOffline({
      now: () => NOW,
      snapshot: snapshot({ revokedAt: NOW - 100 }),
      requestedMode: "child",
    });
    expect(decision.mode).toBe("denied");
    expect(decision.reason).toBe("snapshot-revoked");
  });

  it("denies parent mode offline", () => {
    const decision = canOpenChildModeOffline({
      now: () => NOW,
      snapshot: snapshot(),
      requestedMode: "parent",
    });
    expect(decision.mode).toBe("denied");
    expect(decision.reason).toBe("parent-mode-offline");
  });

  it("permits the safety lockout (microphone disable, consent withdrawal) offline", () => {
    const decision = canOpenChildModeOffline({
      now: () => NOW,
      snapshot: snapshot(),
      requestedMode: "safety-lockout",
    });
    expect(decision.mode).toBe("safety-lockout");
  });

  it("safety lockout is also blocked once the snapshot is revoked", () => {
    const decision = canOpenChildModeOffline({
      now: () => NOW,
      snapshot: snapshot({ revokedAt: NOW - 1 }),
      requestedMode: "safety-lockout",
    });
    expect(decision.mode).toBe("denied");
    expect(decision.reason).toBe("snapshot-revoked");
  });
});