"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { trackInstall, trackUnlockOncePerDay } from "@/lib/analytics";
import { getAuthService } from "@/lib/auth";
import type { AuthUser, SignInInput, SignUpInput } from "@/lib/auth/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const auth = getAuthService();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    auth
      .getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    setUser(await auth.signIn(input));
    try {
      trackUnlockOncePerDay();
    } catch {}
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    setUser(await auth.signUp(input));
    try {
      trackInstall();
    } catch {}
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, []);

  // Auto-lock: sign out after 5 minutes without interaction.
  useEffect(() => {
    if (!user) return;
    const IDLE_MS = 5 * 60 * 1000;
    let lastReset = 0;
    let timer: ReturnType<typeof setTimeout>;
    const lock = () => void signOut();
    const reset = () => {
      const now = Date.now();
      if (now - lastReset < 1000) return; // throttle high-frequency events
      lastReset = now;
      clearTimeout(timer);
      timer = setTimeout(lock, IDLE_MS);
    };
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ] as const;
    reset();
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, signOut]);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
