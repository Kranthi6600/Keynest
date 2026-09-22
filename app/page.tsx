import { ItemManager } from "@/components/ItemManager";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Keynest</h1>
        <p className="text-sm text-zinc-400">
          Items are stored in your browser via IndexedDB. The data layer is
          abstracted behind a repository interface, so it can be swapped for a
          real database later without touching the UI.
        </p>
      </header>
      <ItemManager />
    </main>
  );
}
