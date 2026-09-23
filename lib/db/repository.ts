import type { Item, ItemPatch, NewItem } from "./types";

/**
 * Storage-agnostic repository contract.
 *
 * UI code only ever talks to this interface, so the backing store
 * (IndexedDB today, a real DB behind API routes later) can be
 * swapped in `lib/db/index.ts` without touching components.
 */
export interface Repository<T, NewT, PatchT = Partial<NewT>> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(data: NewT): Promise<T>;
  update(id: string, patch: PatchT): Promise<T>;
  remove(id: string): Promise<void>;
}

export type ItemRepository = Repository<Item, NewItem, ItemPatch>;
