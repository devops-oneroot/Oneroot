"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchCurrentUser, login as apiLogin, setAuthToken } from "@/lib/api";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
  type AuthUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setAuthToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const { token, user: loggedInUser } = await apiLogin(phone, password);
    setStoredToken(token);
    setAuthToken(token);
    setUser({
      ...loggedInUser,
      role: loggedInUser.role || "sales",
      adminScope: loggedInUser.adminScope,
    });
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthToken(null);
      setIsLoading(false);
      return;
    }

    setAuthToken(token);
    fetchCurrentUser()
      .then((current) =>
        setUser({
          ...current,
          role: current.role || "sales",
          adminScope: current.adminScope,
        })
      )
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, [logout]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
