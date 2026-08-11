/**
 * Version pinning (SLC-009-T001).
 * A child session is only valid when every required component version is
 * compatible with the shell revision. The compatibility graph is declared
 * here and is the single source of truth for activation eligibility.
 */
export interface SessionVersionSet {
  readonly shellRevision: string;
  readonly engineVersion: string;
  readonly packVersion: string;
  readonly schemaVersion: string;
  readonly overlayRevision: string | null;
}

export interface CompatibilityRule {
  readonly shellRevision: string;
  readonly acceptedEngineVersions: readonly string[];
  readonly acceptedPackVersions: readonly string[];
  readonly acceptedSchemaVersions: readonly string[];
}

export const COMPATIBILITY_GRAPH: readonly CompatibilityRule[] = [
  {
    shellRevision: "shell-v1",
    acceptedEngineVersions: ["engine-1"],
    acceptedPackVersions: ["0.1.0"],
    acceptedSchemaVersions: ["1.0.0"],
  },
];

export interface PinSessionInput {
  readonly snapshot: SessionVersionSet;
  readonly graph?: readonly CompatibilityRule[];
}

export interface PinSessionResult {
  readonly ok: boolean;
  readonly reason: string | null;
}

export const pinSessionVersions = (
  input: PinSessionInput,
): PinSessionResult => {
  const graph = input.graph ?? COMPATIBILITY_GRAPH;
  const rule = graph.find((r) => r.shellRevision === input.snapshot.shellRevision);
  if (!rule) {
    return { ok: false, reason: "unknown-shell-revision" };
  }
  if (!rule.acceptedEngineVersions.includes(input.snapshot.engineVersion)) {
    return { ok: false, reason: "incompatible-engine" };
  }
  if (!rule.acceptedPackVersions.includes(input.snapshot.packVersion)) {
    return { ok: false, reason: "incompatible-pack" };
  }
  if (!rule.acceptedSchemaVersions.includes(input.snapshot.schemaVersion)) {
    return { ok: false, reason: "incompatible-schema" };
  }
  return { ok: true, reason: null };
};