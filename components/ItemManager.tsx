"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  CopyPlus,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  User,
  Wand2,
  X,
} from "lucide-react";
import { getItemRepository } from "@/lib/db";
import type { Item } from "@/lib/db/types";
import type { NavView } from "./SideNav";

const repo = getItemRepository();

const LEET: Record<string, readonly string[]> = {
  a: ["@", "4"],
  e: ["3"],
  i: ["1", "!"],
  o: ["0"],
  s: ["$", "5"],
  t: ["7"],
  b: ["8"],
  g: ["9"],
  z: ["2"],
};

const SYMBOLS = ["#", "@", "!", "$", "*", "_", "-", "."] as const;

/**
 * "Human-style" password: mutates a seed word the way people actually
 * do — sparse leetspeak, a dropped letter, a symbol slipped inside,
 * and a memorable digit run (e.g. "kranthi" → "krant#i6600").
 */
function generateHumanPassword(seed: string): string {
  const rand = (max: number) =>
    crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const pick = <T,>(arr: readonly T[]): T => arr[rand(arr.length)];

  let word = seed.toLowerCase().replace(/[^a-z]/g, "") || "keynest";

  // Sometimes drop one inner letter ("kranthi" → "kranti").
  if (word.length > 5 && rand(3) === 0) {
    const i = 1 + rand(word.length - 2);
    word = word.slice(0, i) + word.slice(i + 1);
  }

  // Sparse leetspeak — 1 or 2 substitutions, never all of them.
  const chars = word.split("");
  const subs = 1 + rand(2);
  for (let n = 0; n < subs; n++) {
    const candidates = chars
      .map((c, i) => (LEET[c] ? i : -1))
      .filter((i) => i >= 0);
    if (candidates.length === 0) break;
    const i = pick(candidates);
    chars[i] = pick(LEET[chars[i]]);
  }
  word = chars.join("");

  // Occasionally uppercase one letter.
  if (rand(3) === 0) {
    const i = rand(word.length);
    word = word.slice(0, i) + word[i].toUpperCase() + word.slice(i + 1);
  }

  const symbol = pick(SYMBOLS);
  const digits = pick([
    String(10 + rand(90)), // 2-digit
    String(100 + rand(900)), // 3-digit
    `${rand(10)}${rand(10)}${pick(["00", "11", "22", "66", "99"])}`, // 6600-style
    String(1970 + rand(56)), // year-style
  ]);

  let out: string;
  const pattern = rand(3);
  if (pattern === 0) {
    out = word + symbol + digits; // kranti#6600
  } else if (pattern === 1 && word.length > 2) {
    const i = 1 + rand(word.length - 1);
    out = word.slice(0, i) + symbol + word.slice(i) + digits; // krant#i6600
  } else {
    out = word + digits + symbol + rand(10); // kranti6600#3
  }

  // Guarantee a sane minimum length.
  while (out.length < 8) out += String(rand(10));
  return out;
}

/**
 * Subsequence fuzzy match — 0 means no match. Substring hits score
 * highest; scattered in-order matches score lower, so "netflx" still
 * finds "Netflix" but ranks below exact matches.
 */
function fuzzyScore(query: string, text: string): number {
  const t = text.toLowerCase();
  const at = t.indexOf(query);
  if (at >= 0) return 1000 - at;
  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < query.length; ti++) {
    if (t[ti] === query[qi]) {
      qi++;
      score += ++streak * 2;
    } else {
      streak = 0;
    }
  }
  return qi === query.length ? score : 0;
}

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
] as const;

function avatarGradient(name: string): string {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
}

interface ItemManagerProps {
  view: NavView;
  onStats?: (stats: { total: number; favorites: number }) => void;
}

export function ItemManager({ view, onStats }: ItemManagerProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [appName, setAppName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [seed, setSeed] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null); // `${id}:${field}`
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
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

  // Report counts up for the sidebar badges.
  useEffect(() => {
    onStats?.({
      total: items.length,
      favorites: items.filter((i) => i.favorite).length,
    });
  }, [items, onStats]);

  function resetForm() {
    setEditingId(null);
    setAppName("");
    setUsername("");
    setPassword("");
    setSeed("");
    setShowPassword(false);
  }

  function prefillForm(item: Item) {
    setAppName(item.appName);
    setUsername(item.username);
    setPassword(item.password);
    setShowPassword(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEdit(item: Item) {
    setEditingId(item.id);
    prefillForm(item);
  }

  function handleDuplicate(item: Item) {
    setEditingId(null);
    prefillForm(item);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedApp = appName.trim();
    if (!trimmedApp || !password) return;
    const fields = {
      appName: trimmedApp,
      username: username.trim(),
      password,
    };
    try {
      if (editingId) {
        await repo.update(editingId, fields);
      } else {
        await repo.create(fields);
      }
      resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save item");
    }
  }

  function toggleRevealed(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleCopy(item: Item, field: "username" | "password") {
    if (!item[field]) return;
    try {
      await navigator.clipboard.writeText(item[field]);
      const key = `${item.id}:${field}`;
      setCopied(key);
      setTimeout(() => setCopied((cur) => (cur === key ? null : cur)), 1500);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  function handleGenerate() {
    const word = seed.trim() || appName.trim() || username.trim();
    if (!word) return;
    setPassword(generateHumanPassword(word));
    setShowPassword(true);
  }

  async function handleDelete(id: string) {
    try {
      await repo.remove(id);
      if (editingId === id) resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete item");
    }
  }

  async function toggleFavorite(item: Item) {
    try {
      await repo.update(item.id, { favorite: !item.favorite });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update item");
    }
  }

  const query = search.trim().toLowerCase();
  const filtered = items
    .filter((i) => (view === "favorites" ? i.favorite : true))
    .map((i) => ({
      item: i,
      score: query
        ? Math.max(fuzzyScore(query, i.appName), fuzzyScore(query, i.username))
        : 1,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);

  return (
    <section className="flex flex-col gap-5">
      {/* Add form */}
      <form
        id="add-form"
        onSubmit={handleSubmit}
        className="flex scroll-mt-6 flex-col gap-2.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3.5"
      >
        <h2 className="text-sm font-semibold text-zinc-300">
          {editingId ? "Edit password" : "Add a password"}
        </h2>
        {editingId && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-indigo-400">
            <Pencil className="h-3 w-3" />
            Editing entry
          </p>
        )}
        <input
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="App or site name"
          autoComplete="off"
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-base outline-none sm:text-sm transition placeholder:text-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
        />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username or email"
          autoComplete="off"
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-base outline-none sm:text-sm transition placeholder:text-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 pr-10 text-base outline-none sm:text-sm transition placeholder:text-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 transition hover:text-zinc-300 sm:p-1.5"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Base word — e.g. your name"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-base outline-none sm:text-sm transition placeholder:text-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!seed.trim() && !appName.trim() && !username.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            title="Generate a human-style password from the base word"
          >
            <Wand2 className="h-4 w-4" />
            Generate
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!appName.trim() || !password}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {editingId ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingId ? "Update password" : "Save password"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3.5 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Search */}
      {items.length > 0 && (
        <div className="group relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 transition group-focus-within:text-indigo-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search passwords…"
            autoComplete="off"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-11 pr-4 text-base outline-none sm:text-sm transition placeholder:text-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-900/50 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-12 text-center">
          <Sparkles className="h-5 w-5 text-zinc-600" />
          <p className="text-sm text-zinc-500">
            No passwords yet — save your first one above.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {query
            ? `No matches for "${search}"`
            : view === "favorites"
              ? "No favorites yet — star an item to pin it here."
              : "Nothing here yet."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="group flex flex-col gap-2.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3 transition hover:border-zinc-700/80 hover:bg-zinc-900/60 sm:gap-3 sm:p-4"
            >
              {/* Header: avatar + name + star */}
              <div className="flex items-start gap-2 sm:gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-semibold text-white shadow-md sm:h-10 sm:w-10 sm:text-sm ${avatarGradient(item.appName)}`}
                >
                  {item.appName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium sm:text-sm">{item.appName}</p>
                  <p className="mt-0.5 hidden text-xs text-zinc-600 sm:block">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => void toggleFavorite(item)}
                  className={`rounded-lg p-1.5 transition ${
                    item.favorite
                      ? "text-amber-400"
                      : "text-zinc-700 hover:text-amber-400"
                  }`}
                  aria-label={
                    item.favorite ? "Remove from favorites" : "Add to favorites"
                  }
                  title={item.favorite ? "Unfavorite" : "Favorite"}
                >
                  <Star
                    className={`h-4 w-4 ${item.favorite ? "fill-amber-400" : ""}`}
                  />
                </button>
              </div>

              {/* Username row */}
              <div className="flex items-center gap-2 rounded-lg bg-zinc-950/50 px-2 py-1.5 sm:px-2.5">
                <User className="hidden h-3.5 w-3.5 shrink-0 text-zinc-600 sm:block" />
                <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-400 sm:text-xs">
                  {item.username || "—"}
                </span>
                {item.username && (
                  <button
                    onClick={() => void handleCopy(item, "username")}
                    className="rounded p-1.5 text-zinc-600 transition hover:text-zinc-300"
                    aria-label="Copy username"
                    title="Copy username"
                  >
                    {copied === `${item.id}:username` ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Password row */}
              <div className="flex items-center gap-2 rounded-lg bg-zinc-950/50 px-2 py-1.5 sm:px-2.5">
                <Lock className="hidden h-3.5 w-3.5 shrink-0 text-zinc-600 sm:block" />
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-400 sm:text-xs">
                  {revealed.has(item.id) ? item.password : "••••••••••"}
                </span>
                <button
                  onClick={() => toggleRevealed(item.id)}
                  className="rounded p-1.5 text-zinc-600 transition hover:text-zinc-300"
                  aria-label={
                    revealed.has(item.id) ? "Hide password" : "Show password"
                  }
                  title={revealed.has(item.id) ? "Hide" : "Reveal"}
                >
                  {revealed.has(item.id) ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => void handleCopy(item, "password")}
                  className="rounded p-1.5 text-zinc-600 transition hover:text-zinc-300"
                  aria-label="Copy password"
                  title="Copy password"
                >
                  {copied === `${item.id}:password` ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Footer actions */}
              <div className="mt-auto flex items-center justify-end gap-1 border-t border-zinc-800/60 pt-2 sm:pt-2.5">
                <button
                  onClick={() => handleDuplicate(item)}
                  className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-zinc-800/60 hover:text-zinc-300"
                  aria-label="Duplicate item"
                  title="Duplicate"
                >
                  <CopyPlus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-zinc-800/60 hover:text-zinc-300"
                  aria-label="Edit item"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void handleDelete(item.id)}
                  className="rounded-lg p-1.5 text-zinc-600 transition hover:bg-red-950/40 hover:text-red-300"
                  aria-label="Delete item"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
