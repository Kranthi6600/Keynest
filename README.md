# Keynest

Next.js (App Router) + TypeScript + Tailwind CSS. Data is stored in the
browser via **IndexedDB** (through [Dexie](https://dexie.org)) — no database
server required.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Architecture: swappable storage

UI code never touches IndexedDB directly. Everything goes through a
repository interface, so the backend can be swapped later.

```
lib/auth/
  types.ts                     # AuthUser, StoredUser, sign-in/up inputs
  authService.ts               # AuthService interface — the contract
  crypto.ts                    # PBKDF2→HKDF key split + AES-256-GCM helpers
  session.ts                   # Session user id + data-key storage
  lockout.ts                   # Failed sign-in throttling
  index.ts                     # getAuthService() — pick the backend here
  local/
    localAuthService.ts        # IndexedDB users + local session
lib/db/
  types.ts                     # Domain types (Item, NewItem)
  repository.ts                # Repository<T> interface — the contract
  index.ts                     # getItemRepository() — pick the backend here
  indexeddb/
    db.ts                      # Dexie database (lazy singleton, SSR-safe)
    itemRepository.ts          # IndexedDB implementation (per-user scoped)
components/
  AuthProvider.tsx             # Auth context + useAuth() hook
  AuthScreen.tsx               # Sign in / sign up UI
  SiteHeader.tsx               # App header with user + sign out
  HomeClient.tsx               # Gates the app behind auth
  ItemManager.tsx              # Demo CRUD UI (client component)
app/api/health/route.ts        # Health-check route handler
```

## Security (local-first)

- **Encryption at rest** — every item payload (`appName` + `username` +
  `password`) is AES-256-GCM encrypted with a fresh random IV per write. Only
  `id`/`ownerId`/timestamps stay plaintext for indexing.
- **Key hierarchy** — password + salt → PBKDF2-SHA256 (150k iterations)
  → master key → HKDF splits it into an auth verifier (stored) and an
  AES-256 data key (never stored). The stored verifier can't decrypt data.
- **Session** — user id in `localStorage`, data key in `sessionStorage`
  (survives reloads, dies with the browser session → vault re-locks).
- **Lockout** — 5 failed sign-ins lock for 60s (`lib/auth/lockout.ts`).
- **Auto-lock** — signs out after 5 minutes idle (`AuthProvider`).
- **Headers** — `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy` in `next.config.ts`.

**Note:** client-side security protects data at rest, but anyone with
DevTools access to an unlocked browser session can read the key. When a
real backend arrives, replace `localAuthService` with API-backed auth
(HTTP-only cookies/JWT) in `lib/auth/index.ts`.

### Migrating to a real database later

1. Add route handlers under `app/api/items/` that talk to your DB
   (Postgres, SQLite, etc.) — Node.js runtime is the default.
2. Create `lib/db/api/itemRepository.ts` implementing the same
   `ItemRepository` interface, but calling `fetch("/api/items/...")`.
3. Change one line in `lib/db/index.ts` to return the new repository.
4. Same for auth: implement `AuthService` against your auth API and
   change one line in `lib/auth/index.ts`.

No component changes needed.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm start` — serve production build
- `npm run lint` — ESLint
