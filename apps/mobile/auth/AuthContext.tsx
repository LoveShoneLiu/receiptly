import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  createHousehold as createHouseholdRequest,
  getMe,
  logoutSession,
  refreshSession,
} from '../api/auth';
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from './storage';
import type { AuthSession } from './types';

type AuthContextValue = {
  session: AuthSession | null;
  restoring: boolean;
  acceptSession: (session: AuthSession) => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const REFRESH_EARLY_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [restoring, setRestoring] = useState(true);
  const sessionRef = useRef<AuthSession | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthSession> | null>(null);

  const persistSession = useCallback(async (nextSession: AuthSession | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    if (nextSession) await saveStoredSession(nextSession);
    else await clearStoredSession();
  }, []);

  const refresh = useCallback(async (current: AuthSession) => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshSession(current.refreshToken, current)
        .then(async (nextSession) => {
          await persistSession(nextSession);
          return nextSession;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }
    return refreshPromiseRef.current;
  }, [persistSession]);

  useEffect(() => {
    let active = true;
    void loadStoredSession()
      .then(async (stored) => {
        if (!stored || !active) return;
        const validSession = stored.expiresAt <= Date.now() + REFRESH_EARLY_MS
          ? await refresh(stored)
          : stored;
        const synchronizedSession = await getMe(validSession.accessToken, validSession);
        if (active) await persistSession(synchronizedSession);
      })
      .catch(async () => {
        if (active) await persistSession(null);
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, [persistSession, refresh]);

  useEffect(() => {
    if (!session) return undefined;
    const delay = Math.max(0, session.expiresAt - Date.now() - REFRESH_EARLY_MS);
    const timer = setTimeout(() => {
      void refresh(session).catch(() => persistSession(null));
    }, delay);
    return () => clearTimeout(timer);
  }, [persistSession, refresh, session]);

  const acceptSession = useCallback(
    (nextSession: AuthSession) => persistSession(nextSession),
    [persistSession],
  );

  const createHousehold = useCallback(async (name: string) => {
    const current = sessionRef.current;
    if (!current) throw new Error('请先登录。');
    const result = await createHouseholdRequest(current.accessToken, name);
    await persistSession({
      ...current,
      activeHouseholdId: result.activeHouseholdId,
      households: [...current.households, result.household],
      onboardingState: result.onboardingState,
    });
  }, [persistSession]);

  const logout = useCallback(async () => {
    const current = sessionRef.current;
    await persistSession(null);
    if (!current) return;
    try {
      await logoutSession(current.accessToken, current.refreshToken);
    } catch {
      // Local logout must still succeed when the server is unavailable.
    }
  }, [persistSession]);

  const value = useMemo(() => ({
    acceptSession,
    createHousehold,
    logout,
    restoring,
    session,
  }), [acceptSession, createHousehold, logout, restoring, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
};
