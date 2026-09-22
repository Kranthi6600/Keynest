import type { ItemRepository } from "./repository";
import { indexedDbItemRepository } from "./indexeddb/itemRepository";

/**
 * Single place that decides which storage backend the app uses.
 *
 * Today: IndexedDB in the browser.
 * Later: return an API-backed repository here (one that calls the
 * Next.js route handlers talking to a real database) and every
 * component keeps working unchanged.
 */
export function getItemRepository(): ItemRepository {
  return indexedDbItemRepository;
}
