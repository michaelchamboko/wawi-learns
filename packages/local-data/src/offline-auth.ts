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

export type InstallationSnapshot = z.infer<typeof InstallationSnapshotSchema>;

export type OfflineMode = "child" | "parent" | "safety-lockout" | "denied";

export interface OfflineAuthInput {
  readonly now: () => number;
  readonly snapshot: InstallationSnapshot | null;
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