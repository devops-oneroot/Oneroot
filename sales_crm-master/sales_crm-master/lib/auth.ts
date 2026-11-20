const TOKEN_KEY = "sales_crm_token";

export type UserRole = "sales" | "admin";
export type AdminScope = "all" | "export";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role?: UserRole;
  adminScope?: AdminScope;
}

export function isExportOnlyAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "admin" && user.adminScope === "export";
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}
