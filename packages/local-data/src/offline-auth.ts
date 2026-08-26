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

export const parseInstallationSnapshot = (value: unknown): InstallationSnapshot | null => {
  const parsed = InstallationSnapshotSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

export const persistInstallationSnapshot = (
  snapshot: unknown,
  activePack: unknown,
  storage: Pick<Storage, "setItem">,
): boolean => {
  const parsedSnapshot = InstallationSnapshotSchema.safeParse(snapshot);
  const parsedPack = ActivePackStateSchema.safeParse(activePack);
  if (!parsedSnapshot.success || !parsedPack.success || parsedSnapshot.data.packVersion !== parsedPack.data.packVersion || parsedSnapshot.data.packDigest !== parsedPack.data.packDigest) return false;
  storage.setItem(ACTIVE_PACK_KEY, JSON.stringify(parsedPack.data));
  storage.setItem(INSTALLATION_SNAPSHOT_KEY, JSON.stringify(parsedSnapshot.data));
  return true;
};

export const readInstallationSnapshot = (storage: Pick<Storage, "getItem">): InstallationSnapshot | null => {
  const raw = storage.getItem(INSTALLATION_SNAPSHOT_KEY);
  if (!raw) return null;
  try { return parseInstallationSnapshot(JSON.parse(raw)); } catch { return null; }
};

export const readActivePack = (storage: Pick<Storage, "getItem">): ActivePackState | null => {
  const raw = storage.getItem(ACTIVE_PACK_KEY);
  if (!raw) return null;
  try { const parsed = ActivePackStateSchema.safeParse(JSON.parse(raw)); return parsed.success ? parsed.data : null; } catch { return null; }
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
