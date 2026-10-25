/**
 * Where the login token lives: browser localStorage.
 *
 * Trade-off (documented in docs/DECISIONS.md): localStorage is simple and works with the
 * Bearer-token API, but any XSS bug could read it. React escapes output by default and the
 * app renders no raw HTML, which is acceptable for this project; an httpOnly-cookie setup
 * would need a server-side proxy and is listed as a possible hardening step.
 *
 * Exposed as a tiny external store so React can subscribe with useSyncExternalStore
 * (no setState-in-effect, and tabs stay in sync via the `storage` event).
 */
const KEY = "campus-sports.token";
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null; // storage blocked (private mode etc.)
    }
  },

  set(token: string): void {
    try {
      window.localStorage.setItem(KEY, token);
    } catch {
      /* ignore */
    }
    emit();
  },

  clear(): void {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    emit();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};
