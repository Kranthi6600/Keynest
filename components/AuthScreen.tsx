"use client";

import { useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "./AuthProvider";

type Mode = "signin" | "signup";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (name.trim().length < 2) {
        setError("Please enter your name");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn({ email, password });
      } else {
        await signUp({ name, email, password });
      }
      // On success AuthProvider sets the user and HomeClient swaps views.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-xl -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/imgs/keynest.png"
            alt="Keynest logo"
            width={56}
            height={56}
            className="rounded-2xl shadow-lg shadow-indigo-500/30"
            priority
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Keynest</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Only one password to remember.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {mode === "signin"
                ? "Welcome back — sign in to continue"
                : "Create your local workspace"}
            </p>
          </div>
        </div>

        {/* Card with gradient border */}
        <div className="rounded-2xl bg-gradient-to-b from-zinc-700/60 via-zinc-800/40 to-zinc-800/20 p-px shadow-2xl shadow-black/40">
          <div className="rounded-[calc(1rem-1px)] bg-zinc-950/80 p-6 backdrop-blur-xl sm:p-8">
            {/* Mode toggle */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    mode === m
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {mode === "signup" && (
                <Field
                  icon={User}
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <Field
                icon={Mail}
                type="email"
                placeholder="Email address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Field
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder={
                  mode === "signup" ? "Password (min. 8 characters)" : "Password"
                }
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-zinc-500 transition hover:text-zinc-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
              {mode === "signup" && password.length > 0 && (
                <PasswordStrength password={password} />
              )}
              {mode === "signup" && (
                <Field
                  icon={Lock}
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              )}

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-900/50 bg-red-950/40 px-3.5 py-2.5 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "signin" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Trust note */}
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          AES-256-GCM encrypted · PBKDF2 + HKDF keys · stays unlocked for 30 days
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  trailing,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 transition group-focus-within:text-indigo-400" />
      <input
        {...props}
        className={`w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-3 pl-11 text-base text-zinc-100 sm:text-sm outline-none transition placeholder:text-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 ${
          trailing ? "pr-11" : "pr-4"
        } ${className ?? ""}`}
      />
      {trailing && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {trailing}
        </div>
      )}
    </div>
  );
}

function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LEVELS = [
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-lime-500" },
  { label: "Strong", color: "bg-emerald-500" },
] as const;

function PasswordStrength({ password }: { password: string }) {
  const score = passwordScore(password);
  const level = STRENGTH_LEVELS[Math.max(0, score - 1)];
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? level.color : "bg-zinc-800"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-zinc-500">{level.label}</span>
    </div>
  );
}
