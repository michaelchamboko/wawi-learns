import { describe, expect, it } from "vitest";
import {
  canOpenChildModeOffline,
  type InstallationSnapshot,
  type ActivePackState,
  OFFLINE_AUTHORIZATION_KEY,
  parseInstallationSnapshot,
  persistInstallationSnapshot,
  readInstallationSnapshot,
  canQueueDependentProviderWork,
  readOfflineAuthorization,
  requestSafetyLockout,
  acknowledgeSafetyLockout,
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

  it("starts authorization enabled and acknowledges a withdrawal without re-enabling work", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    expect(persistInstallationSnapshot(snapshot(), activePack, storage)).toBe(true);
    expect(readOfflineAuthorization(storage)?.lockout).toEqual({ microphoneDisabled: false, pendingSync: false, acknowledged: false });
    expect(requestSafetyLockout(storage)).toBe(true);
    expect(acknowledgeSafetyLockout(storage)).toBe(true);
    expect(readOfflineAuthorization(storage)?.lockout).toEqual({ microphoneDisabled: true, pendingSync: false, acknowledged: true });
    expect(canQueueDependentProviderWork({ pending: false, acknowledged: true })).toBe(false);
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
    expect(values.has(OFFLINE_AUTHORIZATION_KEY)).toBe(true);
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

  it("persists the safety lockout without enabling dependent provider work", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    expect(persistInstallationSnapshot(snapshot(), activePack, storage)).toBe(true);
    expect(requestSafetyLockout(storage)).toBe(true);
    expect(readOfflineAuthorization(storage)?.lockout).toEqual({ microphoneDisabled: true, pendingSync: true, acknowledged: false });
    expect(canQueueDependentProviderWork({ pending: true, acknowledged: false })).toBe(false);
  });

  it("keeps the prior envelope when storage rejects an update", () => {
    const values = new Map<string, string>();
    const stable = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    expect(persistInstallationSnapshot(snapshot(), activePack, stable)).toBe(true);
    const prior = values.get(OFFLINE_AUTHORIZATION_KEY);
    const failing = { getItem: stable.getItem, setItem: () => { throw new Error("offline storage unavailable"); } };
    expect(persistInstallationSnapshot(snapshot({ installationId: "install-b" }), activePack, failing)).toBe(false);
    expect(values.get(OFFLINE_AUTHORIZATION_KEY)).toBe(prior);
  });
});
