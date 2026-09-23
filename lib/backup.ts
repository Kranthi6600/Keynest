import {
  decryptJson,
  deriveBackupKey,
  encryptJson,
  generateSalt,
} from "./auth/crypto";
import type { Item } from "./db/types";

/**
 * Vault backup helpers — encrypted `.keynest` files and plain-text CSV.
 * Encrypted backups are AES-256-GCM under a key derived from a separate
 * backup passphrase, so the file is safe to store or send anywhere.
 */

const BACKUP_MARKER = "keynest-backup";

interface BackupFile {
  app: string;
  version: 1;
  salt: string;
  iv: string;
  data: string;
}

/** Fields that survive a backup round-trip. */
export interface BackupEntry {
  appName: string;
  username: string;
  password: string;
  favorite?: boolean;
  createdAt?: number;
}

export async function buildEncryptedBackup(
  items: Item[],
  passphrase: string,
): Promise<string> {
  const salt = generateSalt();
  const key = await deriveBackupKey(passphrase, salt);
  const entries: BackupEntry[] = items.map(
    ({ appName, username, password, favorite, createdAt }) => ({
      appName,
      username,
      password,
      favorite,
      createdAt,
    }),
  );
  const { iv, data } = await encryptJson(key, entries);
  return JSON.stringify(
    { app: BACKUP_MARKER, version: 1, salt, iv, data } satisfies BackupFile,
    null,
    2,
  );
}

export function isEncryptedBackup(text: string): boolean {
  try {
    return (JSON.parse(text) as BackupFile).app === BACKUP_MARKER;
  } catch {
    return false;
  }
}

export async function parseEncryptedBackup(
  text: string,
  passphrase: string,
): Promise<BackupEntry[]> {
  let file: BackupFile;
  try {
    file = JSON.parse(text) as BackupFile;
  } catch {
    throw new Error("That file isn't valid JSON");
  }
  if (file.app !== BACKUP_MARKER) {
    throw new Error("That file isn't a Keynest backup");
  }
  const key = await deriveBackupKey(passphrase, file.salt);
  try {
    const entries = await decryptJson<BackupEntry[]>(key, file.iv, file.data);
    return entries.filter((e) => e.appName && e.password);
  } catch {
    throw new Error("Wrong passphrase or corrupted backup");
  }
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Plain-text export — CSV columns: appName, username, password, favorite. */
export function buildPlainTextBackup(items: Item[]): string {
  const rows = items.map((i) =>
    [i.appName, i.username, i.password, i.favorite ? "1" : ""]
      .map(csvCell)
      .join(","),
  );
  return ["appName,username,password,favorite", ...rows].join("\n");
}

/** Splits one CSV line on commas outside quotes. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells;
}

/** Parses the plain-text/CSV format produced by buildPlainTextBackup. */
export function parsePlainTextBackup(text: string): BackupEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const entries: BackupEntry[] = [];
  for (const line of lines) {
    if (/^appName\s*,/i.test(line)) continue; // header row
    const [appName, username = "", password = "", favorite = ""] =
      parseCsvLine(line);
    if (!appName || !password) continue;
    entries.push({
      appName,
      username,
      password,
      favorite: favorite === "1" || /^true$/i.test(favorite),
    });
  }
  return entries;
}
