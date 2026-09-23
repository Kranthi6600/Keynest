import Dexie, { type EntityTable } from "dexie";
import type { StoredUser } from "@/lib/auth/types";
import type { StoredItem } from "../types";

/**
 * Dexie database for browser-side storage.
 *
 * The instance is created lazily so importing this module during
 * SSR / build never touches `indexedDB` (which only exists in the
 * browser).
 */
class KeynestDatabase extends Dexie {
  items!: EntityTable<StoredItem, "id">;
  users!: EntityTable<StoredUser, "id">;

  constructor() {
    super("keynest");
    this.version(1).stores({
      items: "id, createdAt, name",
    });
    this.version(2).stores({
      // v2: items gain an ownerId index for per-user scoping,
      // plus the users table for local auth.
      items: "id, createdAt, name, ownerId",
      users: "id, email",
    });
    this.version(3)
      .stores({
        // v3: item payloads are AES-256-GCM encrypted — `name` is no
        // longer plaintext so its index is dropped.
        items: "id, createdAt, ownerId",
        users: "id, email",
      })
      .upgrade(async (tx) => {
        // Legacy plaintext items and pre-HKDF user records can't be
        // migrated — clear them (dev-stage data only).
        await tx.table("items").clear();
        await tx.table("users").clear();
      });
  }
}

let db: KeynestDatabase | undefined;

export function getDb(): KeynestDatabase {
  if (!db) {
    db = new KeynestDatabase();
  }
  return db;
}
