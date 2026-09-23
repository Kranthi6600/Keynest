"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "./AuthProvider";

const STRENGTHS = [
  "Local-only storage — data never leaves this browser (IndexedDB)",
  "PBKDF2-SHA256 · 150,000 iterations · per-user salt",
  "HKDF-separated keys — auth verifier cannot decrypt data",
  "AES-256-GCM data key held in sessionStorage — vault locks on browser close",
  "Sign-in throttling — 5 failed attempts triggers a 60s lockout",
];

const GAPS = [
  "Data key is readable from sessionStorage while the vault is unlocked",
  "Lockout counter can be reset by clearing site data",
];

export function SiteFooter() {
  const { user } = useAuth();

  return (
    <footer className={`border-t border-zinc-800/60 ${user ? "md:pl-64" : ""}`}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          Security assessment
        </p>
        <ul className="grid gap-1.5 text-xs leading-relaxed text-zinc-500 sm:grid-cols-2">
          {STRENGTHS.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500/70" />
              {s}
            </li>
          ))}
          {GAPS.map((g) => (
            <li key={g} className="flex items-start gap-2 text-amber-500/80">
              <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
              {g}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-zinc-700">
          Keynest · local-first vault · no server, no sync
        </p>
      </div>
    </footer>
  );
}
