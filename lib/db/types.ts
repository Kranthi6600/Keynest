/**
 * Domain types shared by every storage backend.
 * When the real database arrives, these stay unchanged.
 */

export interface Item {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export type NewItem = Pick<Item, "name" | "description">;
