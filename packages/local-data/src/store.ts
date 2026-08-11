import { openDB, type IDBPDatabase } from "idb";
import type { AttemptEvent, SyncReceipt } from "./types.js";

const DB_NAME = "wawi-spike-local-data";
const DB_VERSION = 1;
const STORE_ATTEMPTS = "attempts";
const STORE_OUTBOX = "outbox";
const STORE_META = "meta";

export interface AppendAttemptResult {
  readonly eventId: string;
  readonly sourceSequence: number;
}

export class LocalAttemptStore {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private readonly name: string;

  constructor(name: string = DB_NAME) {
    this.name = name;
  }

  private async open(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.name, DB_VERSION, {
        upgrade(db) {
          const attempts = db.createObjectStore(STORE_ATTEMPTS, { keyPath: "eventId" });
          attempts.createIndex("bySourceSequence", "sourceSequence", { unique: false });
          attempts.createIndex("byOccurredAt", "occurredAt", { unique: false });

          const outbox = db.createObjectStore(STORE_OUTBOX, { keyPath: "eventId" });
          outbox.createIndex("bySourceSequence", "sourceSequence", { unique: false });

          db.createObjectStore(STORE_META, { keyPath: "key" });
        },
      });
    }
    return this.dbPromise;
  }

  async appendAttempt(event: AttemptEvent): Promise<AppendAttemptResult> {
    const db = await this.open();
    const tx = db.transaction([STORE_ATTEMPTS, STORE_OUTBOX, STORE_META], "readwrite");
    const attempts = tx.objectStore(STORE_ATTEMPTS);
    const outbox = tx.objectStore(STORE_OUTBOX);
    const meta = tx.objectStore(STORE_META);

    const existing = await attempts.get(event.eventId);
    if (existing) {
      await tx.done;
      return { eventId: existing.eventId as string, sourceSequence: existing.sourceSequence as number };
    }

    const counter = await meta.get("sourceSequence");
    const next = (typeof counter?.value === "number" ? counter.value : 0) + 1;
    if (event.sourceSequence !== 0 && event.sourceSequence !== next) {
      await tx.done;
      throw new Error(
        `appendAttempt: expected sourceSequence=${next} but received ${event.sourceSequence}`,
      );
    }

    const persisted: AttemptEvent = { ...event, sourceSequence: next };
    await attempts.put(persisted);
    await outbox.put(persisted);
    await meta.put({ key: "sourceSequence", value: next });

    await tx.done;
    return { eventId: persisted.eventId, sourceSequence: next };
  }

  async nextSyncBatch(limit: number): Promise<readonly AttemptEvent[]> {
    const db = await this.open();
    const tx = db.transaction(STORE_OUTBOX, "readonly");
    const index = tx.store.index("bySourceSequence");
    const batch: AttemptEvent[] = [];
    let cursor = await index.openCursor();
    while (cursor && batch.length < limit) {
      batch.push(cursor.value as AttemptEvent);
      cursor = await cursor.continue();
    }
    await tx.done;
    return batch;
  }

  async acknowledgeSync(receipt: SyncReceipt): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    const accepted = new Set(receipt.acceptedEventIds);
    for (const id of accepted) {
      await tx.store.delete(id);
    }
    await tx.done;
  }

  async readAllAttempts(): Promise<readonly AttemptEvent[]> {
    const db = await this.open();
    const tx = db.transaction(STORE_ATTEMPTS, "readonly");
    const all = (await tx.store.getAll()) as AttemptEvent[];
    await tx.done;
    return all.sort((a, b) => a.sourceSequence - b.sourceSequence);
  }

  async reset(): Promise<void> {
    const db = await this.open();
    await db.clear(STORE_ATTEMPTS);
    await db.clear(STORE_OUTBOX);
    await db.clear(STORE_META);
  }
}