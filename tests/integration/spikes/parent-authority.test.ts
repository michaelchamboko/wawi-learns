import { expect, test } from "vitest";
import { getCurrentLearnerHome } from "../../../convex/learner";
import { createOnlyChildProfile } from "../../../convex/childProfiles";
import { ingestAttempts } from "../../../convex/attempts";
import { ResendOTP } from "../../../convex/ResendOTP";
import { RECENT_VERIFICATION_WINDOW_MS } from "../../../convex/lib/requireParent";

const NOW = 1_700_000_000_000;
type ParentRow = { readonly _id: string; readonly userId: string; readonly verifiedAt: number; readonly email?: string };
type ChildProfileRow = { readonly _id: string; readonly parentId: string; readonly displayName: string; };
type InstallationRow = { readonly childProfileId: string; readonly installationId: string; readonly parentId: string };
type AttemptRow = {
  readonly _id?: string;
  readonly installationId: string;
  readonly eventId: string;
  readonly sourceSequence: number;
};
type AttemptEventRow = {
  readonly eventId: string;
  readonly installationId: string;
  readonly sourceSequence: number;
  readonly occurredAt: number;
  readonly recordedAt: number;
  readonly dimension: string;
  readonly itemId: string;
  readonly result: string;
  readonly hintCount: number;
  readonly durationMs: number;
  readonly clientVersion: string;
};
type RuntimeHandler<Args, Return = unknown> = {
  _handler: (ctx: object, args: Args) => Promise<Return>;
};

const createContext = (args: {
  subject: string;
  parents: readonly ParentRow[];
  childProfiles: readonly ChildProfileRow[];
  installations: readonly InstallationRow[];
  attempts?: readonly AttemptRow[];
}) => {
  const insertedParents: ParentRow[] = [];
  const insertedAttempts: AttemptRow[] = [];
  return {
    context: {
      auth: {
        getUserIdentity: async () => ({ subject: args.subject, email: "parent@example.com" }),
      },
      db: {
        query: (table: string) => ({
          withIndex: (
            indexOrCallback:
              | string
              | ((query: { eq: (field: string, value: string) => void }) => void),
            callbackMaybe?: (query: { eq: (field: string, value: string) => void }) => void,
          ) => {
            const callback = typeof indexOrCallback === "function" ? indexOrCallback : callbackMaybe;
            if (!callback) {
              throw new Error("callback is required");
            }
            let eqField: string | null = null;
            let eqValue: string | null = null;
            callback({
              eq: (field: string, value: string) => {
                eqField = field;
                eqValue = value;
              },
            });
            const source = (() => {
              switch (table) {
                case "parents":
                  return [...args.parents, ...insertedParents];
                case "childProfiles":
                  return args.childProfiles;
                case "installations":
                  return args.installations;
                case "attempts":
                  return args.attempts ?? [];
                default:
                  return [];
              }
            })();
            const match = (row: Record<string, unknown>) =>
              eqField === null || eqValue === null || row[eqField] === eqValue;
            return {
              collect: async () => source.filter(match) as readonly ParentRow[],
              unique: async () => {
                const rows = source.filter(match);
                return (rows[0] as unknown) ?? null;
              },
              first: async () => {
                const rows = source.filter(match);
                return (rows[0] as unknown) ?? null;
              },
            };
          },
          collect: async () => {
            switch (table) {
              case "parents":
                return [...args.parents, ...insertedParents];
              case "childProfiles":
                return args.childProfiles;
              case "installations":
                return args.installations;
              case "attempts":
                return args.attempts ?? [];
              default:
                return [];
            }
          },
        }),
        get: async (id: string) => {
          const match = [...args.parents, ...insertedParents].find((row) => row._id === id);
          return match ? { ...match, email: "parent@example.com" } : null;
        },
        insert: async (table: string, doc: ParentRow | ChildProfileRow | AttemptEventRow) => {
          if (table === "parents") {
            const insertedParent = { ...doc, _id: `parent-${insertedParents.length + 1}` };
            insertedParents.push(insertedParent as ParentRow);
            return insertedParent._id;
          }
          if (table === "attempts") {
            insertedAttempts.push(doc as AttemptEventRow);
            return `attempt-${insertedAttempts.length}`;
          }
          return "parent-1";
        },
      },
      runQuery: async () => ({}),
    },
    getInsertedParentCount: () => insertedParents.length,
    getInsertedAttemptCount: () => insertedAttempts.length,
    getNow: () => NOW,
  };
};

test("SLC-011-T002 — parent authority mutations are defined", () => {
  expect(createOnlyChildProfile).toBeTypeOf("function");
  expect(ResendOTP).toBeDefined();
});

test("SLC-011-T002 — getCurrentLearnerHome follows stable identity ownership", async () => {
  const { context } = createContext({
    subject: "stable-user|new-session",
    parents: [{ _id: "parent-1", userId: "stable-user", verifiedAt: NOW }],
    childProfiles: [{ _id: "child-1", parentId: "parent-1", displayName: "Maya" }],
    installations: [],
    attempts: [],
  });
  const handler = (
    getCurrentLearnerHome as unknown as RuntimeHandler<
      object,
      { profile: { _id: string; displayName: string } | null; completedCount: number }
    >
  )._handler;
  const out = await handler(context, {});
  expect(out.profile).toMatchObject({ _id: "child-1", displayName: "Maya" });
  expect(out.profile).not.toBeNull();
});

test("SLC-011-T002 — sensitive child creation rejects stale verified parent records", async () => {
  const { context, getInsertedParentCount } = createContext({
    subject: "stable-user|new-session",
    parents: [
      {
        _id: "parent-1",
        userId: "stable-user",
        verifiedAt: NOW - RECENT_VERIFICATION_WINDOW_MS - 1,
      },
    ],
    childProfiles: [],
    installations: [],
    attempts: [],
  });
  const handler = (
    createOnlyChildProfile as unknown as RuntimeHandler<{ displayName: string }, unknown>
  )._handler;
  await expect(
    handler(context, { displayName: "Maya" }),
  ).rejects.toThrowError(/re-enter password/i);
  expect(getInsertedParentCount()).toBe(0);
});

test("SLC-011-T002 — ingestAttempts deduplicates event IDs and skips reprocessing", async () => {
  const { context, getInsertedAttemptCount } = createContext({
    subject: "stable-user|new-session",
    parents: [{ _id: "parent-1", userId: "stable-user", verifiedAt: NOW }],
    childProfiles: [],
    installations: [{ parentId: "parent-1", childProfileId: "child-1", installationId: "install-1" }],
    attempts: [{ installationId: "install-1", eventId: "event-1", sourceSequence: 1 }],
  });
  const handler = (
    ingestAttempts as unknown as RuntimeHandler<{
      events: {
        eventId: string;
        installationId: string;
        sourceSequence: number;
        occurredAt: number;
        recordedAt: number;
        dimension: string;
        itemId: string;
        result: string;
        hintCount: number;
        durationMs: number;
        clientVersion: string;
      }[];
    }, { dedupedEventIds: string[]; acceptedEventIds: string[]; gapDetected?: boolean }>
  )._handler;
  const out = await handler(context, {
    events: [
      {
        eventId: "event-1",
        installationId: "install-1",
        sourceSequence: 1,
        occurredAt: NOW,
        recordedAt: NOW,
        dimension: "dimension",
        itemId: "word-1",
        result: "correct",
        hintCount: 0,
        durationMs: 0,
        clientVersion: "test",
      },
    ],
  });
  expect(out).toMatchObject({ dedupedEventIds: ["event-1"], acceptedEventIds: [] });
  expect(getInsertedAttemptCount()).toBe(0);
});

test("SLC-011-T002 — ingestAttempts records sequence gaps and does not accept gapped events", async () => {
  const { context, getInsertedAttemptCount } = createContext({
    subject: "stable-user|new-session",
    parents: [{ _id: "parent-1", userId: "stable-user", verifiedAt: NOW }],
    childProfiles: [],
    installations: [{ parentId: "parent-1", childProfileId: "child-1", installationId: "install-1" }],
    attempts: [{ installationId: "install-1", eventId: "event-1", sourceSequence: 1 }],
  });
  const handler = (
    ingestAttempts as unknown as RuntimeHandler<{
      events: {
        eventId: string;
        installationId: string;
        sourceSequence: number;
        occurredAt: number;
        recordedAt: number;
        dimension: string;
        itemId: string;
        result: string;
        hintCount: number;
        durationMs: number;
        clientVersion: string;
      }[];
    }, { gapDetected?: boolean; acceptedEventIds: string[] }>
  )._handler;
  const out = await handler(context, {
    events: [
      {
        eventId: "event-5",
        installationId: "install-1",
        sourceSequence: 5,
        occurredAt: NOW,
        recordedAt: NOW,
        dimension: "dimension",
        itemId: "word-1",
        result: "correct",
        hintCount: 0,
        durationMs: 0,
        clientVersion: "test",
      },
    ],
  });
  expect(out).toMatchObject({ gapDetected: true, acceptedEventIds: [] });
  expect(getInsertedAttemptCount()).toBe(0);
});

test("SLC-011-T002 — ingestAttempts rejects revoked installations", async () => {
  const { context, getInsertedAttemptCount } = createContext({
    subject: "stable-user|new-session",
    parents: [{ _id: "parent-1", userId: "stable-user", verifiedAt: NOW }],
    childProfiles: [],
    installations: [{
      parentId: "parent-1",
      childProfileId: "child-1",
      installationId: "install-1",
      revokedAt: NOW,
    } as InstallationRow & { revokedAt: number }],
    attempts: [],
  });
  const handler = (
    ingestAttempts as unknown as RuntimeHandler<{
      events: {
        eventId: string;
        installationId: string;
        sourceSequence: number;
        occurredAt: number;
        recordedAt: number;
        dimension: string;
        itemId: string;
        result: string;
        hintCount: number;
        durationMs: number;
        clientVersion: string;
      }[];
    }, { acceptedEventIds: string[]; rejectedEventIds: string[] }>
  )._handler;
  const promise = handler(context, {
    events: [
      {
        eventId: "event-1",
        installationId: "install-1",
        sourceSequence: 1,
        occurredAt: NOW,
        recordedAt: NOW,
        dimension: "dimension",
        itemId: "word-1",
        result: "correct",
        hintCount: 0,
        durationMs: 0,
        clientVersion: "test",
      },
    ],
  });
  await expect(promise).rejects.toThrowError("installation ownership mismatch");
  expect(getInsertedAttemptCount()).toBe(0);
});
