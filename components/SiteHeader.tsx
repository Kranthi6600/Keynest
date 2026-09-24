"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function SiteHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/imgs/keynest-logo.png"
            alt=""
            width={28}
            height={28}
            className="rounded-lg shadow-md shadow-indigo-500/25"
          />
          <span className="text-sm font-semibold tracking-tight">Keynest</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-zinc-500 sm:block">
            {user?.email}
          </span>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
