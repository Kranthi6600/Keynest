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
import { getSessionExpiresAt } from "@/lib/auth/session";
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

  // Auto-lock: sign out when the 30-day session expires, even if the
  // tab stays open the whole time.
  useEffect(() => {
    if (!user) return;
    const expiresAt = getSessionExpiresAt();
    if (!expiresAt) return;
    const timer = setTimeout(
      () => void signOut(),
      Math.max(expiresAt - Date.now(), 0),
    );
    return () => clearTimeout(timer);
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
