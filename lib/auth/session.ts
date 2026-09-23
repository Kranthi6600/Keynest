/**
 * Session persistence for the local auth backend.
 * Stores the signed-in user's id in localStorage.
 *
 * When real auth arrives this is replaced by HTTP-only cookies /
 * server sessions — nothing outside `lib/auth` should rely on it,
 * except the local item repository which scopes data per user.
 */

import { importDataKey } from "./crypto";

const SESSION_KEY = "keynest:session";
const DATA_KEY_KEY = "keynest:datakey";

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(userId: string | null): void {
  if (typeof window === "undefined") return;
  if (userId === null) {
    window.localStorage.removeItem(SESSION_KEY);
  } else {
    window.localStorage.setItem(SESSION_KEY, userId);
  }
}

// --- Data key (AES-256-GCM) ---
// sessionStorage: survives reloads, dies with the browser session.
// Cached as a non-extractable CryptoKey in memory after first use.

let cachedDataKey: CryptoKey | null = null;

export function getExportedDataKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(DATA_KEY_KEY);
}

export function setExportedDataKey(raw: string | null): void {
  cachedDataKey = null;
  if (typeof window === "undefined") return;
  if (raw === null) {
    window.sessionStorage.removeItem(DATA_KEY_KEY);
  } else {
    window.sessionStorage.setItem(DATA_KEY_KEY, raw);
  }
}

export async function getDataKey(): Promise<CryptoKey | null> {
  if (cachedDataKey) return cachedDataKey;
  const raw = getExportedDataKey();
  if (!raw) return null;
  cachedDataKey = await importDataKey(raw);
  return cachedDataKey;
}
