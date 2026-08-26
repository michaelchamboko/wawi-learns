import { z } from "zod";

export const InstallationSnapshotSchema = z.object({
  installationId: z.string(),
  parentId: z.string().min(1),
  childProfileId: z.string().min(1),
  packVersion: z.string(),
  packDigest: z.string().regex(/^[a-f0-9]{64}$/),
  issuedAt: z.number(),
  revokedAt: z.number().optional(),
});

export const ActivePackStateSchema = z.object({
  packVersion: z.string().min(1),
  packDigest: z.string().regex(/^[a-f0-9]{64}$/),
  essentialAssetUrls: z.array(z.string().min(1)).min(1),
  complete: z.boolean(),
});

export type InstallationSnapshot = z.infer<typeof InstallationSnapshotSchema>;
export type ActivePackState = z.infer<typeof ActivePackStateSchema>;

export const INSTALLATION_SNAPSHOT_KEY = "wawi.installation.snapshot";
export const ACTIVE_PACK_KEY = "wawi.active.pack";
export const OFFLINE_AUTHORIZATION_KEY = "wawi.offline.authorization";
export const SafetyLockoutStateSchema = z.object({ microphoneDisabled: z.boolean(), pendingSync: z.boolean(), acknowledged: z.boolean() });
export const OfflineAuthorizationEnvelopeSchema = z.object({ snapshot: InstallationSnapshotSchema, activePack: ActivePackStateSchema, lockout: SafetyLockoutStateSchema });
export type SafetyLockoutState = z.infer<typeof SafetyLockoutStateSchema>;
export type OfflineAuthorizationEnvelope = z.infer<typeof OfflineAuthorizationEnvelopeSchema>;

export const parseInstallationSnapshot = (value: unknown): InstallationSnapshot | null => {
  const parsed = InstallationSnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

export const persistInstallationSnapshot = (
  snapshot: unknown,
  activePack: unknown,
  storage: Pick<Storage, "setItem" | "getItem">,
): boolean => {
  const parsedSnapshot = InstallationSnapshotSchema.safeParse(snapshot);
  const parsedPack = ActivePackStateSchema.safeParse(activePack);
  if (!parsedSnapshot.success || !parsedPack.success || parsedSnapshot.data.packVersion !== parsedPack.data.packVersion || parsedSnapshot.data.packDigest !== parsedPack.data.packDigest) return false;
  const envelope: OfflineAuthorizationEnvelope = { snapshot: parsedSnapshot.data, activePack: parsedPack.data, lockout: { microphoneDisabled: false, pendingSync: false, acknowledged: false } };
  try { storage.setItem(OFFLINE_AUTHORIZATION_KEY, JSON.stringify(envelope)); } catch { return false; }
  return true;
};

export const readInstallationSnapshot = (storage: Pick<Storage, "getItem">): InstallationSnapshot | null => {
  return readOfflineAuthorization(storage)?.snapshot ?? null;
};

export const readActivePack = (storage: Pick<Storage, "getItem">): ActivePackState | null => {
  return readOfflineAuthorization(storage)?.activePack ?? null;
};

export const readOfflineAuthorization = (storage: Pick<Storage, "getItem">): OfflineAuthorizationEnvelope | null => {
  const raw = storage.getItem(OFFLINE_AUTHORIZATION_KEY);
  if (!raw) return null;
  try { const parsed = OfflineAuthorizationEnvelopeSchema.safeParse(JSON.parse(raw)); return parsed.success ? parsed.data : null; } catch { return null; }
};

export const requestSafetyLockout = (storage: Pick<Storage, "getItem" | "setItem">): boolean => {
  const current = readOfflineAuthorization(storage);
  if (!current) return false;
  try { storage.setItem(OFFLINE_AUTHORIZATION_KEY, JSON.stringify({ ...current, lockout: { microphoneDisabled: true, pendingSync: true, acknowledged: false } })); return true; } catch { return false; }
};

export const acknowledgeSafetyLockout = (storage: Pick<Storage, "getItem" | "setItem">): boolean => {
  const current = readOfflineAuthorization(storage);
  if (!current) return false;
  try { storage.setItem(OFFLINE_AUTHORIZATION_KEY, JSON.stringify({ ...current, lockout: { microphoneDisabled: true, pendingSync: false, acknowledged: true } })); return true; } catch { return false; }
};

export type SafetyWithdrawalState = { readonly pending: boolean; readonly acknowledged: boolean };
export const canQueueDependentProviderWork = (state: SafetyWithdrawalState): boolean => !state.pending && !state.acknowledged;

export type OfflineMode = "child" | "parent" | "safety-lockout" | "denied";

export interface OfflineAuthInput {
  readonly now: () => number;
  readonly snapshot: InstallationSnapshot | null;
  readonly activePack?: ActivePackState | null;
  readonly requestedMode: Exclude<OfflineMode, "denied">;
}

export interface OfflineAuthDecision {
  readonly mode: OfflineMode;
  readonly reason: string;
}

/**
 * Local-only authorisation for opening an offline child session.
 * The parent mode is denied offline unless `requestedMode = safety-lockout`,
 * which can only reduce permissions (microphone disable, consent withdrawal).
 */
export function canOpenChildModeOffline(input: OfflineAuthInput): OfflineAuthDecision {
  if (!input.snapshot) {
    return { mode: "denied", reason: "no-snapshot" };
  }
  if (!input.activePack || input.activePack.packVersion !== input.snapshot.packVersion || input.activePack.packDigest !== input.snapshot.packDigest || !input.activePack.complete) {
    return { mode: "denied", reason: "pack-unavailable" };
  }
  if (input.snapshot.revokedAt && input.snapshot.revokedAt <= input.now()) {
    return { mode: "denied", reason: "snapshot-revoked" };
  }
  if (input.requestedMode === "child") {
    return { mode: "child", reason: "snapshot-valid" };
  }
  if (input.requestedMode === "safety-lockout") {
    return { mode: "safety-lockout", reason: "snapshot-valid" };
  }
  return { mode: "denied", reason: "parent-mode-offline" };
}
