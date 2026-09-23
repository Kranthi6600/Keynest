import type { AuthService } from "./authService";
import { localAuthService } from "./local/localAuthService";

/**
 * Single place that decides which auth backend the app uses.
 *
 * Today: local IndexedDB auth (PBKDF2-hashed passwords, localStorage
 * session).
 * Later: return a server-backed implementation here (Next.js route
 * handlers + real DB + HTTP-only cookies) and every component keeps
 * working unchanged.
 */
export function getAuthService(): AuthService {
  return localAuthService;
}
