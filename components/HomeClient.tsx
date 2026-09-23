"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { AuthScreen } from "./AuthScreen";
import { AboutView } from "./AboutView";
import { ItemManager } from "./ItemManager";
import { SideNav, type NavView } from "./SideNav";
import { SiteHeader } from "./SiteHeader";

export function HomeClient() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<NavView>("all");
  const [stats, setStats] = useState({ total: 0, favorites: 0 });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen">
      <SideNav
        view={view}
        onViewChange={setView}
        total={stats.total}
        favorites={stats.favorites}
      />

      {/* Mobile top bar (sidebar is hidden below md) */}
      <div className="md:hidden">
        <SiteHeader />
      </div>

      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              {view === "about"
                ? "About Keynest"
                : view === "favorites"
                  ? "Favorites"
                  : `Welcome back, ${user.name}`}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {view === "about"
                ? "What this app does and how it protects your data"
                : "AES-256-GCM encrypted · stored only in this browser"}
            </p>
          </div>

          {/* Mobile view tabs */}
          <div className="sticky top-0 z-10 mb-6 grid grid-cols-3 gap-1 rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-1 backdrop-blur-xl md:hidden">
            {(["all", "favorites", "about"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  view === v
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {v === "all" ? "All" : v === "favorites" ? "Favorites" : "About"}
              </button>
            ))}
          </div>

          {view === "about" ? (
            <AboutView />
          ) : (
            <ItemManager view={view} onStats={setStats} />
          )}
        </main>
      </div>
    </div>
  );
}
