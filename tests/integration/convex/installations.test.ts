import { describe, expect, it } from "vitest";
import { installationSnapshotFor, registerInstallation } from "../../../convex/installations";
import schema from "../../../convex/schema";
import { ESSENTIAL_PACK_DIGEST } from "../../../packages/local-data/src/essential-pack";

describe("SLC-002-T005 — installation snapshot contract", () => {
  it("registers a new device using only schema fields and returns its authorization timestamp", async () => {
    let stored: Record<string, unknown> | null = null;
    const context = {
      auth: { getUserIdentity: async () => ({ subject: "user-1" }) },
      db: {
        query: (table: string) => ({
          collect: async () => [{ _id: "parent-1", userId: "user-1", verifiedAt: Date.now() }],
          withIndex: () => ({
            first: async () => table === "childProfiles" ? { _id: "child-1", parentId: "parent-1" } : null,
            unique: async () => stored,
          }),
        }),
        insert: async (_table: string, value: Record<string, unknown>) => {
          const fields = schema.tables.installations.validator.fields;
          for (const key of Object.keys(value)) {
            if (!(key in fields)) throw new Error(`Object contains extra field ${key}`);
          }
          stored = { _id: "installation-1", ...value };
          return "installation-1";
        },
        patch: async (_id: string, value: Record<string, unknown>) => { stored = { ...stored, ...value }; },
      },
    };
    const handler = (registerInstallation as unknown as {
      _handler: (ctx: unknown, args: { installationId: string }) => Promise<ReturnType<typeof installationSnapshotFor>>;
    })._handler;
    const snapshot = await handler(context, { installationId: "install-1" });
    expect(snapshot.issuedAt).toBeGreaterThan(0);
    expect(stored).toMatchObject({ parentId: "parent-1", childProfileId: "child-1", installationId: "install-1", lastSeenAt: snapshot.issuedAt });
    expect(stored).not.toHaveProperty("issuedAt");
    await expect(handler(context, { installationId: "install-1" })).resolves.toMatchObject({ installationId: "install-1", packDigest: ESSENTIAL_PACK_DIGEST });
  });

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
