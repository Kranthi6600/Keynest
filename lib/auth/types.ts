/**
 * Auth domain types shared by every auth backend.
 * When real server-side auth arrives, these stay unchanged.
 */

/** Public user shape — never contains password material. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

/** Stored user record — local backend only, never leaves the data layer. */
export interface StoredUser extends AuthUser {
  /** HKDF-derived verifier — cannot decrypt user data. */
  authHash: string;
  salt: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}
