import type { ItemRepository } from "../repository";
import type { Item, NewItem } from "../types";
import { getDb } from "./db";

/**
 * IndexedDB-backed implementation of the item repository.
 * Runs entirely in the browser — no server round-trips.
 */
export const indexedDbItemRepository: ItemRepository = {
  async list() {
    return getDb().items.orderBy("createdAt").reverse().toArray();
  },

  async get(id) {
    return getDb().items.get(id);
  },

  async create(data) {
    const now = Date.now();
    const item: Item = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().items.add(item);
    return item;
  },

  async update(id, patch) {
    const db = getDb();
    const updated = await db.items.update(id, { ...patch, updatedAt: Date.now() });
    if (!updated) {
      throw new Error(`Item ${id} not found`);
    }
    const item = await db.items.get(id);
    return item as Item;
  },

  async remove(id) {
    await getDb().items.delete(id);
  },
};
