import { getDb } from "@/lib/db/indexeddb/db";
import type { AuthService } from "../authService";
import { createCredentials, unlockWithPassword } from "../crypto";
import {
  clearAttempts,
  getLockoutRemaining,
  recordFailedAttempt,
} from "../lockout";
import {
  getExportedDataKey,
  getSessionUserId,
  setExportedDataKey,
  setSessionUserId,
} from "../session";
import type { AuthUser, StoredUser } from "../types";

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Local auth backend: users live in IndexedDB, passwords unlock an
 * HKDF-separated auth verifier, and the derived AES-256-GCM data key
 * is kept in sessionStorage. Swap for real server auth in
 * `lib/auth/index.ts`.
 */
export const localAuthService: AuthService = {
  async signUp({ name, email, password }) {
    const db = getDb();
    const normalized = normalizeEmail(email);

    const existing = await db.users.where("email").equals(normalized).first();
    if (existing) {
      throw new Error("An account with this email already exists");
    }

    const { salt, authHash, exportedDataKey } = await createCredentials(password);
    const user: StoredUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalized,
      authHash,
      salt,
      createdAt: Date.now(),
    };
    await db.users.add(user);
    setSessionUserId(user.id);
    setExportedDataKey(exportedDataKey);
    clearAttempts();
    return toAuthUser(user);
  },

  async signIn({ email, password }) {
    const lockedFor = getLockoutRemaining();
    if (lockedFor > 0) {
      throw new Error(
        `Too many failed attempts — try again in ${Math.ceil(lockedFor / 1000)}s`,
      );
    }

    const db = getDb();
    const user = await db.users
      .where("email")
      .equals(normalizeEmail(email))
      .first();

    const unlocked = user
      ? await unlockWithPassword(password, user.salt, user.authHash)
      : null;

    if (!user || !unlocked) {
      recordFailedAttempt();
      const remaining = getLockoutRemaining();
      throw new Error(
        remaining > 0
          ? `Too many failed attempts — try again in ${Math.ceil(remaining / 1000)}s`
          : "Invalid email or password",
      );
    }

    setSessionUserId(user.id);
    setExportedDataKey(unlocked.exportedDataKey);
    clearAttempts();
    return toAuthUser(user);
  },

  async signOut() {
    setSessionUserId(null);
    setExportedDataKey(null);
  },

  async getCurrentUser() {
    const userId = getSessionUserId();
    if (!userId) return null;
    // Session without a data key (e.g. browser restarted and
    // sessionStorage was cleared) means the vault is locked —
    // force re-authentication.
    if (!getExportedDataKey()) {
      setSessionUserId(null);
      return null;
    }
    const user = await getDb().users.get(userId);
    return user ? toAuthUser(user) : null;
  },
};
