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
lib/db/
  types.ts                     # Domain types (Item, NewItem)
  repository.ts                # Repository<T> interface — the contract
  index.ts                     # getItemRepository() — pick the backend here
  indexeddb/
    db.ts                      # Dexie database (lazy singleton, SSR-safe)
    itemRepository.ts          # IndexedDB implementation
components/
  ItemManager.tsx              # Demo CRUD UI (client component)
app/api/health/route.ts        # Health-check route handler
```

### Migrating to a real database later

1. Add route handlers under `app/api/items/` that talk to your DB
   (Postgres, SQLite, etc.) — Node.js runtime is the default.
2. Create `lib/db/api/itemRepository.ts` implementing the same
   `ItemRepository` interface, but calling `fetch("/api/items/...")`.
3. Change one line in `lib/db/index.ts` to return the new repository.

No component changes needed.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm start` — serve production build
- `npm run lint` — ESLint
