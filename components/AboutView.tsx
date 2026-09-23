import {
  Fingerprint,
  KeyRound,
  Lock,
  ServerOff,
  ShieldCheck,
  Split,
  Timer,
} from "lucide-react";

const SECURITY_FEATURES = [
  {
    icon: ShieldCheck,
    title: "AES-256-GCM encryption",
    body: "Every item is sealed with authenticated encryption and a fresh random IV, so ciphertext can't be tampered with silently.",
  },
  {
    icon: Fingerprint,
    title: "PBKDF2-SHA256 · 150k rounds",
    body: "Your master key is stretched from your password with 150,000 iterations — it's derived at sign-in and never stored anywhere.",
  },
  {
    icon: Split,
    title: "Separated keys",
    body: "HKDF splits the master key into a sign-in verifier and a data key, so the stored hash can never decrypt your vault.",
  },
  {
    icon: Timer,
    title: "Auto-lock on close",
    body: "The data key lives only in sessionStorage — reloads stay unlocked, but closing the browser locks the vault again.",
  },
  {
    icon: Lock,
    title: "Brute-force lockout",
    body: "Five consecutive failed sign-ins trigger a 60-second lock, slowing down password-guessing attempts.",
  },
  {
    icon: ServerOff,
    title: "100% local storage",
    body: "Everything lives in this browser's IndexedDB — no servers, no sync. The only outbound request is an optional anonymous counter ping, which honors Do Not Track.",
  },
];

export function AboutView() {
  return (
    <div className="flex flex-col gap-5">
      {/* What is Keynest */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 shadow-md shadow-indigo-500/25">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold tracking-tight">What is Keynest?</h2>
            <p className="text-xs text-zinc-500">Local-first password vault</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Keynest is a password manager that keeps your credentials entirely on
          this device. Save app logins in a searchable card grid, pin important
          ones to Favorites, generate strong passwords, and copy or reveal them
          with a click — all inside a vault that is encrypted before anything
          touches disk.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          There is no account server and no cloud backup: your vault lives in
          this browser's IndexedDB, and only your master password can unlock it.
        </p>
      </section>

      {/* Security level */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight">Security level</h2>
            <p className="text-xs text-zinc-500">
              How your data is protected, end to end
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Strong · local-only
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SECURITY_FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-indigo-500/10 p-1.5">
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-500">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Note */}
      <section className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm leading-relaxed text-amber-200/80">
        <span className="font-medium text-amber-200">Keep in mind:</span> since
        your master password is the only way to derive the encryption key,
        forgetting it means the vault cannot be recovered — there is no reset
        or recovery server by design.
      </section>
    </div>
  );
}
