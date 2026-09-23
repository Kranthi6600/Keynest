/**
 * Domain types shared by every storage backend.
 * When the real database arrives, these stay unchanged.
 */

export interface Item {
  id: string;
  ownerId: string;
  appName: string;
  username: string;
  password: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export type NewItem = Pick<Item, "appName" | "username" | "password">;

/** Fields that can be patched via repository.update(). */
export type ItemPatch = Partial<
  Pick<Item, "appName" | "username" | "password" | "favorite">
>;

/**
 * What actually lives in IndexedDB — `data` is the AES-256-GCM
 * ciphertext of { appName, username, password }, `iv` is the
 * per-write nonce. Only metadata needed for indexing stays plaintext.
 */
export interface StoredItem {
  id: string;
  ownerId: string;
  iv: string;
  data: string;
  createdAt: number;
  updatedAt: number;
}
