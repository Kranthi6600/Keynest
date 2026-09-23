import type { AuthUser, SignInInput, SignUpInput } from "./types";

/**
 * Storage-agnostic auth contract.
 *
 * UI code only ever talks to this interface, so the backing
 * implementation (local IndexedDB today, real server auth with
 * sessions/JWT later) can be swapped in `lib/auth/index.ts`
 * without touching components.
 */
export interface AuthService {
  signUp(input: SignUpInput): Promise<AuthUser>;
  signIn(input: SignInInput): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
