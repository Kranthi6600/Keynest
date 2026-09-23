/**
 * Sign-in attempt throttling for the local backend.
 * After MAX_ATTEMPTS consecutive failures, sign-in locks for LOCK_MS.
 * State lives in localStorage so it survives reloads.
 */

const LOCKOUT_KEY = "keynest:lockout";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

interface LockoutState {
  failures: number;
  lockedUntil: number;
}

function read(): LockoutState {
  if (typeof window === "undefined") return { failures: 0, lockedUntil: 0 };
  try {
    const raw = window.localStorage.getItem(LOCKOUT_KEY);
    return raw ? (JSON.parse(raw) as LockoutState) : { failures: 0, lockedUntil: 0 };
  } catch {
    return { failures: 0, lockedUntil: 0 };
  }
}

function write(state: LockoutState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
}

/** Milliseconds remaining on an active lockout, or 0 if not locked. */
export function getLockoutRemaining(): number {
  const remaining = read().lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/** Records a failed sign-in; starts the lock timer at MAX_ATTEMPTS. */
export function recordFailedAttempt(): void {
  const state = read();
  const failures = state.failures + 1;
  write({
    failures,
    lockedUntil: failures >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0,
  });
}

/** Clears the counter after a successful sign-in. */
export function clearAttempts(): void {
  write({ failures: 0, lockedUntil: 0 });
}
