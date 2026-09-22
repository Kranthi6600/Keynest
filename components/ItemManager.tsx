"use client";

import { useCallback, useEffect, useState } from "react";
import { getItemRepository } from "@/lib/db";
import type { Item } from "@/lib/db/types";

const repo = getItemRepository();

export function ItemManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await repo.list());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await repo.create({ name: trimmed, description: description.trim() });
      setName("");
      setDescription("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save item");
    }
  }

  async function handleDelete(id: string) {
    try {
      await repo.remove(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete item");
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-500"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-500"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="self-start rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add item
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No items yet. Add your first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {item.description && (
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {item.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-600">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => void handleDelete(item.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-red-300"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
