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
const SESSION_EXP_KEY = "keynest:sessionExp";
const DATA_KEY_KEY = "keynest:datakey";

/** Sessions expire 30 days after sign-in. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  const userId = window.localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  const expiresAt = Number(window.localStorage.getItem(SESSION_EXP_KEY));
  if (!expiresAt) {
    // Session from before expiry tracking — grant a fresh window.
    window.localStorage.setItem(
      SESSION_EXP_KEY,
      String(Date.now() + SESSION_TTL_MS),
    );
    return userId;
  }
  if (Date.now() >= expiresAt) {
    setSessionUserId(null);
    return null;
  }
  return userId;
}

export function setSessionUserId(userId: string | null): void {
  if (typeof window === "undefined") return;
  if (userId === null) {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(SESSION_EXP_KEY);
  } else {
    window.localStorage.setItem(SESSION_KEY, userId);
    window.localStorage.setItem(
      SESSION_EXP_KEY,
      String(Date.now() + SESSION_TTL_MS),
    );
  }
}

/** Epoch ms when the current session expires, or null. */
export function getSessionExpiresAt(): number | null {
  if (typeof window === "undefined") return null;
  const expiresAt = Number(window.localStorage.getItem(SESSION_EXP_KEY));
  return expiresAt > 0 ? expiresAt : null;
}

// --- Data key (AES-256-GCM) ---
// localStorage: survives reloads and browser restarts, cleared on
// sign-out or session expiry. Cached as a non-extractable CryptoKey
// in memory after first use.

let cachedDataKey: CryptoKey | null = null;

export function getExportedDataKey(): string | null {
  if (typeof window === "undefined") return null;
  // Migrate keys stored in sessionStorage by older versions.
  const legacy = window.sessionStorage.getItem(DATA_KEY_KEY);
  if (legacy) {
    window.localStorage.setItem(DATA_KEY_KEY, legacy);
    window.sessionStorage.removeItem(DATA_KEY_KEY);
    return legacy;
  }
  return window.localStorage.getItem(DATA_KEY_KEY);
}

export function setExportedDataKey(raw: string | null): void {
  cachedDataKey = null;
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DATA_KEY_KEY);
  if (raw === null) {
    window.localStorage.removeItem(DATA_KEY_KEY);
  } else {
    window.localStorage.setItem(DATA_KEY_KEY, raw);
  }
}

export async function getDataKey(): Promise<CryptoKey | null> {
  if (cachedDataKey) return cachedDataKey;
  const raw = getExportedDataKey();
  if (!raw) return null;
  cachedDataKey = await importDataKey(raw);
  return cachedDataKey;
}
