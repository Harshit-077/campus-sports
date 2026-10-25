"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

import { authApi } from "./services";
import { tokenStore } from "./token-store";
import type { Role, User } from "./types";

export type AuthStatus = "loading" | "anonymous" | "authenticated" | "error";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (input: { name: string; email: string; password: string; student_id?: string }) => Promise<User>;
  logout: () => void;
  /** Retry loading the profile after a network error. */
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const subscribeNever = () => () => {};
/** false while rendering on the server and during hydration, true afterwards. */
const useHydrated = () => useSyncExternalStore(subscribeNever, () => true, () => false);
const useToken = () => useSyncExternalStore(tokenStore.subscribe, tokenStore.get, () => null);

export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const token = useToken();

  // The token is part of the key, so logging in as someone else never shows stale data.
  const me = useQuery({
    queryKey: ["me", token],
    queryFn: authApi.me,
    enabled: hydrated && token !== null,
    staleTime: 5 * 60_000,
    retry: false,
  });

  let status: AuthStatus;
  if (!hydrated) status = "loading";
  else if (token === null) status = "anonymous";
  else if (me.data) status = "authenticated";
  else if (me.isError) status = "error"; // a 401 would have cleared the token -> "anonymous"
  else status = "loading";

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login(email, password);
      queryClient.setQueryData(["me", result.access_token], result.user); // no extra /me round-trip
      tokenStore.set(result.access_token);
      return result.user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; student_id?: string }) => {
      await authApi.register(input);
      return login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
  }, [queryClient]);

  const retry = useCallback(() => {
    void me.refetch();
  }, [me]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: status === "authenticated" ? (me.data ?? null) : null,
      login,
      register,
      logout,
      retry,
    }),
    [status, me.data, login, register, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
