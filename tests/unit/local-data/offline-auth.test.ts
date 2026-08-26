import { describe, expect, it } from "vitest";
import {
  canOpenChildModeOffline,
  type InstallationSnapshot,
  type ActivePackState,
  INSTALLATION_SNAPSHOT_KEY,
  parseInstallationSnapshot,
  persistInstallationSnapshot,
  readInstallationSnapshot,
  canQueueDependentProviderWork,
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
const activePack: ActivePackState = { packVersion: "1.0.0", packDigest: "a".repeat(64), essentialAssetUrls: ["/pack/entry.json"], complete: true };
const auth = (overrides: Partial<Parameters<typeof canOpenChildModeOffline>[0]> = {}) => ({ now: () => NOW, snapshot: snapshot(), activePack, requestedMode: "child" as const, ...overrides });

describe("SLC-002-T005 — offline authorisation", () => {
  it("opens child mode when the snapshot is valid", () => {
    const decision = canOpenChildModeOffline(auth());
    expect(decision.mode).toBe("child");
    expect(decision.reason).toBe("snapshot-valid");
  });

  it("denies child mode when no snapshot exists", () => {
    const decision = canOpenChildModeOffline(auth({ snapshot: null }));
    expect(decision.mode).toBe("denied");
    expect(decision.reason).toBe("no-snapshot");
  });

  it("denies child mode when the snapshot has been revoked", () => {
    const decision = canOpenChildModeOffline(auth({ snapshot: snapshot({ revokedAt: NOW - 100 }) }));
    expect(decision.mode).toBe("denied");
    expect(decision.reason).toBe("snapshot-revoked");
  });

  it("denies parent mode offline", () => {
    const decision = canOpenChildModeOffline(auth({ requestedMode: "parent" }));
    expect(decision.mode).toBe("denied");
    expect(decision.reason).toBe("parent-mode-offline");
  });

  it("permits the safety lockout (microphone disable, consent withdrawal) offline", () => {
    const decision = canOpenChildModeOffline(auth({ requestedMode: "safety-lockout" }));
    expect(decision.mode).toBe("safety-lockout");
  });

  it("safety lockout is also blocked once the snapshot is revoked", () => {
    const decision = canOpenChildModeOffline(auth({ snapshot: snapshot({ revokedAt: NOW - 1 }), requestedMode: "safety-lockout" }));
    expect(decision.mode).toBe("denied");
    expect(decision.reason).toBe("snapshot-revoked");
  });

  it("parses malformed snapshots as denied and preserves the prior stored value on a bad pack update", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    expect(persistInstallationSnapshot(snapshot(), activePack, storage)).toBe(true);
    const prior = readInstallationSnapshot(storage);
    expect(persistInstallationSnapshot({ ...snapshot(), packDigest: "b".repeat(64) }, activePack, storage)).toBe(false);
    expect(readInstallationSnapshot(storage)).toEqual(prior);
    expect(parseInstallationSnapshot({ ...snapshot(), parentId: "" })).toBeNull();
    expect(values.has(INSTALLATION_SNAPSHOT_KEY)).toBe(true);
  });

  it("denies missing, incomplete, or mismatched active packs", () => {
    expect(canOpenChildModeOffline(auth({ activePack: null })).reason).toBe("pack-unavailable");
    expect(canOpenChildModeOffline(auth({ activePack: { ...activePack, complete: false } })).reason).toBe("pack-unavailable");
    expect(canOpenChildModeOffline(auth({ activePack: { ...activePack, packVersion: "2.0.0" } })).reason).toBe("pack-unavailable");
  });

  it("keeps pending safety withdrawal from queuing dependent provider work", () => {
    expect(canQueueDependentProviderWork({ pending: true, acknowledged: false })).toBe(false);
    expect(canQueueDependentProviderWork({ pending: false, acknowledged: true })).toBe(false);
    expect(canQueueDependentProviderWork({ pending: false, acknowledged: false })).toBe(true);
  });
});
