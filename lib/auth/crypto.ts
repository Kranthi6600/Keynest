/**
 * Cryptography for the local backend — Web Crypto only.
 *
 * Key hierarchy (password-manager style):
 *   password + salt --PBKDF2-SHA256(150k)--> master key (256 bits, never stored)
 *   master --HKDF("keynest:auth")--> auth hash (stored, verifies sign-in)
 *   master --HKDF("keynest:data")--> AES-256-GCM data key (encrypts items)
 *
 * Auth and encryption keys are separated so the stored verifier can never
 * be used to decrypt data. The data key lives in sessionStorage: reloads
 * stay unlocked, closing the browser locks the vault again.
 */

const PBKDF2_ITERATIONS = 150_000;
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12; // AES-GCM standard nonce size
const HKDF_SALT = new Uint8Array(32); // static salt — PBKDF2 salt already provides uniqueness

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveMasterBits(
  password: string,
  salt: Uint8Array,
): Promise<ArrayBuffer> {
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    base,
    256,
  );
}

async function hkdfBits(master: ArrayBuffer, info: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", master, "HKDF", false, [
    "deriveBits",
  ]);
  return crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: HKDF_SALT as BufferSource,
      info: encoder.encode(info),
    },
    key,
    256,
  );
}

async function hkdfAesKey(master: ArrayBuffer, info: string): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey("raw", master, "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: HKDF_SALT as BufferSource,
      info: encoder.encode(info),
    },
    key,
    { name: "AES-GCM", length: 256 },
    true, // extractable — needed to persist in sessionStorage
    ["encrypt", "decrypt"],
  );
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export interface Credentials {
  salt: string;
  authHash: string;
  dataKey: CryptoKey;
  exportedDataKey: string;
}

/** Derives a fresh salt + auth hash + data key for a new account. */
export async function createCredentials(password: string): Promise<Credentials> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const master = await deriveMasterBits(password, salt);
  const authHash = toBase64(await hkdfBits(master, "keynest:auth"));
  const dataKey = await hkdfAesKey(master, "keynest:data");
  const exportedDataKey = toBase64(await crypto.subtle.exportKey("raw", dataKey));
  return { salt: toBase64(salt), authHash, dataKey, exportedDataKey };
}

/**
 * Verifies a password against the stored auth hash. On success returns the
 * derived data key; on failure returns null. Constant-time comparison.
 */
export async function unlockWithPassword(
  password: string,
  salt: string,
  expectedAuthHash: string,
): Promise<{ dataKey: CryptoKey; exportedDataKey: string } | null> {
  const master = await deriveMasterBits(password, fromBase64(salt));
  const actual = new Uint8Array(await hkdfBits(master, "keynest:auth"));
  if (!constantTimeEqual(actual, fromBase64(expectedAuthHash))) {
    return null;
  }
  const dataKey = await hkdfAesKey(master, "keynest:data");
  const exportedDataKey = toBase64(await crypto.subtle.exportKey("raw", dataKey));
  return { dataKey, exportedDataKey };
}

/** Re-imports a persisted raw AES key (from sessionStorage). */
export async function importDataKey(rawBase64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    fromBase64(rawBase64) as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

/** AES-256-GCM encrypt with a fresh random IV per call. */
export async function encryptJson(
  key: CryptoKey,
  value: unknown,
): Promise<{ iv: string; data: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return { iv: toBase64(iv), data: toBase64(ciphertext) };
}

/** AES-256-GCM decrypt. Throws if the key or ciphertext is wrong/tampered. */
export async function decryptJson<T>(
  key: CryptoKey,
  iv: string,
  data: string,
): Promise<T> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) as BufferSource },
    key,
    fromBase64(data) as BufferSource,
  );
  return JSON.parse(decoder.decode(plaintext)) as T;
}
