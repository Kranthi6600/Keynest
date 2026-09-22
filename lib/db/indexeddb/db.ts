import Dexie, { type EntityTable } from "dexie";
import type { Item } from "../types";

/**
 * Dexie database for browser-side storage.
 *
 * The instance is created lazily so importing this module during
 * SSR / build never touches `indexedDB` (which only exists in the
 * browser).
 */
class KeynestDatabase extends Dexie {
  items!: EntityTable<Item, "id">;

  constructor() {
    super("keynest");
    this.version(1).stores({
      // Indexed fields: primary key `id`, plus indexes we query by.
      items: "id, createdAt, name",
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
