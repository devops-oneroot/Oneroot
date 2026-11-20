"use client";

import { LoginScreen } from "@/components/auth/LoginScreen";
import { CrmApp } from "@/components/crm/CrmApp";
import { useAuth } from "@/providers/AuthProvider";

export function AppGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7]">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <CrmApp />;
}
