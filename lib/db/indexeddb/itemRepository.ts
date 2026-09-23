import { decryptJson, encryptJson } from "@/lib/auth/crypto";
import { getDataKey, getSessionUserId } from "@/lib/auth/session";
import type { ItemRepository } from "../repository";
import type { Item, StoredItem } from "../types";
import { getDb } from "./db";

function requireUserId(): string {
  const userId = getSessionUserId();
  if (!userId) {
    throw new Error("Not signed in");
  }
  return userId;
}

async function requireDataKey(): Promise<CryptoKey> {
  const key = await getDataKey();
  if (!key) {
    throw new Error("Vault is locked — sign in again");
  }
  return key;
}

/** The encrypted payload shape inside StoredItem.data */
interface ItemPayload {
  appName: string;
  username?: string; // optional — records written before the field existed
  password: string;
  favorite?: boolean;
}

async function toItem(stored: StoredItem, key: CryptoKey): Promise<Item> {
  const payload = await decryptJson<ItemPayload>(key, stored.iv, stored.data);
  return {
    id: stored.id,
    ownerId: stored.ownerId,
    appName: payload.appName,
    username: payload.username ?? "",
    password: payload.password,
    favorite: payload.favorite ?? false,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}

/**
 * IndexedDB-backed implementation of the item repository.
 * Runs entirely in the browser — no server round-trips.
 * Every payload is AES-256-GCM encrypted with the session data key;
 * only id/ownerId/timestamps are stored in plaintext for indexing.
 */
export const indexedDbItemRepository: ItemRepository = {
  async list() {
    const ownerId = requireUserId();
    const key = await requireDataKey();
    const stored = await getDb()
      .items.where("ownerId")
      .equals(ownerId)
      .toArray();
    const items = await Promise.all(
      // Skip records that fail to decrypt rather than breaking the list.
      stored.map((s) => toItem(s, key).catch(() => null)),
    );
    return items
      .filter((i): i is Item => i !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async get(id) {
    const ownerId = requireUserId();
    const key = await requireDataKey();
    const stored = await getDb().items.get(id);
    if (!stored || stored.ownerId !== ownerId) return undefined;
    return toItem(stored, key);
  },

  async create(data) {
    const ownerId = requireUserId();
    const key = await requireDataKey();
    const now = Date.now();
    const { iv, data: ciphertext } = await encryptJson(key, {
      appName: data.appName,
      username: data.username,
      password: data.password,
      favorite: false,
    } satisfies ItemPayload);
    const stored: StoredItem = {
      id: crypto.randomUUID(),
      ownerId,
      iv,
      data: ciphertext,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().items.add(stored);
    return toItem(stored, key);
  },

  async update(id, patch) {
    const db = getDb();
    const ownerId = requireUserId();
    const key = await requireDataKey();
    const existing = await db.items.get(id);
    if (!existing || existing.ownerId !== ownerId) {
      throw new Error(`Item ${id} not found`);
    }
    const current = await toItem(existing, key);
    const { iv, data: ciphertext } = await encryptJson(key, {
      appName: patch.appName ?? current.appName,
      username: patch.username ?? current.username,
      password: patch.password ?? current.password,
      favorite: patch.favorite ?? current.favorite,
    } satisfies ItemPayload);
    const updated: StoredItem = {
      ...existing,
      iv,
      data: ciphertext,
      updatedAt: Date.now(),
    };
    await db.items.put(updated);
    return toItem(updated, key);
  },

  async remove(id) {
    const db = getDb();
    const ownerId = requireUserId();
    const existing = await db.items.get(id);
    if (existing?.ownerId === ownerId) {
      await db.items.delete(id);
    }
  },
};
