"use client";

import Image from "next/image";
import { Info, LayoutGrid, LogOut, Plus, Star } from "lucide-react";
import { useAuth } from "./AuthProvider";

export type NavView = "all" | "favorites" | "about";

interface SideNavProps {
  view: NavView;
  onViewChange: (view: NavView) => void;
  total: number;
  favorites: number;
}

/** Fixed left sidebar — desktop only (mobile gets the top bar + tabs). */
export function SideNav({ view, onViewChange, total, favorites }: SideNavProps) {
  const { user, signOut } = useAuth();

  const links = [
    { id: "all" as NavView, label: "All passwords", icon: LayoutGrid, count: total },
    { id: "favorites" as NavView, label: "Favorites", icon: Star, count: favorites },
    { id: "about" as NavView, label: "About", icon: Info, count: undefined },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-zinc-800/60 bg-zinc-950/60 backdrop-blur-xl md:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image
          src="/imgs/keynest.png"
          alt=""
          width={36}
          height={36}
          className="rounded-xl shadow-md shadow-indigo-500/25"
        />
        <div>
          <p className="text-sm font-semibold tracking-tight">Keynest</p>
          <p className="text-[11px] text-zinc-600">Local vault</p>
        </div>
      </div>

      {/* New password */}
      <div className="px-4 pb-2">
        <button
          onClick={() => {
            if (view === "about") onViewChange("all");
            setTimeout(
              () =>
                document
                  .getElementById("add-form")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" }),
              50,
            );
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400"
        >
          <Plus className="h-4 w-4" />
          New password
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-3">
        {links.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
              view === id
                ? "bg-zinc-800/80 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            {count !== undefined && (
              <span className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[11px] text-zinc-500">
                {count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {/* User */}
      <div className="border-t border-zinc-800/60 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-xs font-semibold text-zinc-300">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-zinc-600">{user?.email}</p>
          </div>
          <button
            onClick={() => void signOut()}
            className="rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-800/60 hover:text-zinc-300"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
