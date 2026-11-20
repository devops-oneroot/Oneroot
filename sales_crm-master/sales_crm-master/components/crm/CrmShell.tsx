"use client";

import { format } from "date-fns";
import {
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  Globe,
  IndianRupee,
  LayoutGrid,
  ListChecks,
  LogOut,
  Plus,
  ShoppingBag,
  Table2,
  Truck,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

export type CrmTab =
  | "leads"
  | "activity"
  | "outreach"
  | "mydays"
  | "analytics"
  | "followup"
  | "suppliers"
  | "importers"
  | "match"
  | "dailyprice"
  | "tasks";

interface CrmShellProps {
  activeTab: CrmTab;
  onTabChange: (tab: CrmTab) => void;
  onCreateLead: () => void;
  onAddSupplier?: () => void;
  onAddImporter?: () => void;
  onAddDailyPrice?: () => void;
  onAssignTask?: () => void;
  onLogout: () => void;
  userName: string;
  userPhone?: string;
  isAdmin?: boolean;
  /** Overdue + due-soon tasks — shown as a badge on the Tasks tab. */
  taskAlertCount?: number;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: CrmTab;
  label: string;
  shortLabel: string;
  icon: typeof Users;
  adminOnly?: boolean;
}[] = [
  { id: "analytics", label: "Analytics", shortLabel: "Stats", icon: BarChart3 },
  { id: "leads", label: "Leads", shortLabel: "Leads", icon: Users },
  { id: "tasks", label: "Task Management", shortLabel: "Tasks", icon: ListChecks },
  { id: "activity", label: "Activity", shortLabel: "Board", icon: LayoutGrid },
  { id: "outreach", label: "Outreach", shortLabel: "Touch", icon: Table2 },
  { id: "mydays", label: "My Days", shortLabel: "Days", icon: CalendarDays },
  {
    id: "followup",
    label: "Follow up",
    shortLabel: "Follow",
    icon: CalendarClock,
    adminOnly: true,
  },
  { id: "suppliers", label: "Suppliers", shortLabel: "Supp", icon: Truck },
  { id: "importers", label: "Importers", shortLabel: "Imports", icon: Globe },
  { id: "match", label: "Match", shortLabel: "Match", icon: ShoppingBag },
  {
    id: "dailyprice",
    label: "Daily Price",
    shortLabel: "Price",
    icon: IndianRupee,
  },
];

const PAGE_META: Record<CrmTab, { title: string; subtitle: string; action: string }> = {
  analytics: {
    title: "Analytics",
    subtitle: "Charts and insights across your leads",
    action: "Create Lead",
  },
  leads: {
    title: "Leads",
    subtitle: "View and manage all customer leads",
    action: "Create Lead",
  },
  activity: {
    title: "Activity",
    subtitle: "Pipeline board — drag cards to update status",
    action: "Create Lead",
  },
  outreach: {
    title: "Outreach",
    subtitle: "Daily calls, emails, WhatsApp and lead touches by user",
    action: "Create Lead",
  },
  mydays: {
    title: "My Days",
    subtitle: "Daily reports from Activity",
    action: "Create Lead",
  },
  followup: {
    title: "Follow up",
    subtitle: "Overdue follow-ups across all leads",
    action: "Create Lead",
  },
  suppliers: {
    title: "Suppliers",
    subtitle: "Manage turmeric suppliers",
    action: "Add Supplier",
  },
  importers: {
    title: "Importers",
    subtitle: "Manage international buyers and import clients",
    action: "Add Importer",
  },
  match: {
    title: "Match",
    subtitle: "See which leads match each supplier",
    action: "Create Lead",
  },
  dailyprice: {
    title: "Daily Price",
    subtitle: "Turmeric prices by polish type and location",
    action: "Add Daily Price",
  },
  tasks: {
    title: "Task Management",
    subtitle: "Assigned tasks with priority, due date and alert colour",
    action: "Assign Task",
  },
};

/** Tabs whose header action button does not apply. */
const NO_ACTION_TABS: CrmTab[] = [
  "analytics",
  "match",
  "mydays",
  "outreach",
  "followup",
];

export function CrmShell({
  activeTab,
  onTabChange,
  onCreateLead,
  onAddSupplier,
  onAddImporter,
  onAddDailyPrice,
  onAssignTask,
  onLogout,
  userName,
  userPhone,
  isAdmin = false,
  taskAlertCount = 0,
  children,
}: CrmShellProps) {
  const meta = PAGE_META[activeTab];
  const subtitle =
    activeTab === "mydays"
      ? isAdmin
        ? "View sales team daily reports (admin days are not tracked)"
        : "Auto-saved daily reports from your Activity"
      : meta.subtitle;
  const today = format(new Date(), "EEE, MMM d");
  const isActivity = activeTab === "activity";
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );
  // Only admins assign tasks — everyone else just works their list.
  const showAction =
    !NO_ACTION_TABS.includes(activeTab) &&
    (activeTab !== "tasks" || isAdmin);

  return (
    <div className="flex min-h-dvh bg-[#f4f5f7] lg:min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-[#0b0e1e] text-white shadow-xl lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <BrandLogo
            surface="on-dark"
            className="h-11 w-full max-w-[180px]"
            priority
          />
          <p className="mt-2 text-[11px] font-medium text-slate-400">
            OneRoot · Sales CRM
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {visibleNavItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const badge = id === "tasks" ? taskAlertCount : 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={cn(
                  "relative mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {badge > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
                {active && badge === 0 && (
                  <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-violet-500" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-xs text-slate-500">© OneRoot</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0e1e] px-3 text-white sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <BrandLogo
              surface="on-dark"
              className="h-7 w-24 shrink-0 sm:h-8 sm:w-32 lg:hidden"
            />
            <p className="truncate text-xs text-slate-300 sm:text-sm">{today}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="hidden rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white sm:block"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="hidden max-w-[8rem] truncate text-right sm:block md:max-w-none">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-xs text-slate-400">
                {userPhone || "OneRoot"}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:px-4"
              aria-label="Logout"
            >
              <span className="hidden sm:inline">Logout</span>
              <LogOut className="h-4 w-4 sm:hidden" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:p-4 lg:p-6 lg:pb-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {meta.title}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            </div>
            {showAction && (
              <button
                type="button"
                onClick={
                  activeTab === "suppliers"
                    ? onAddSupplier
                    : activeTab === "importers"
                      ? onAddImporter
                      : activeTab === "dailyprice"
                        ? onAddDailyPrice
                        : activeTab === "tasks"
                          ? onAssignTask
                          : onCreateLead
                }
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                {meta.action}
              </button>
            )}
          </div>

          <div
            className={cn(
              "bg-white shadow-sm",
              isActivity
                ? "overflow-hidden rounded-lg border-0 sm:border sm:border-slate-200/80 sm:rounded-xl"
                : "overflow-hidden rounded-xl border border-slate-200/80"
            )}
          >
            {children}
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-[#0b0e1e] pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        aria-label="Main navigation"
      >
        {visibleNavItems.map(({ id, shortLabel, icon: Icon }) => {
          const active = activeTab === id;
          const badge = id === "tasks" ? taskAlertCount : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-white" : "text-slate-400"
              )}
            >
              {badge > 0 && (
                <span className="absolute right-1/2 top-1 translate-x-3 rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">
                  {badge}
                </span>
              )}
              <Icon className={cn("h-5 w-5", active && "text-violet-400")} />
              <span>{shortLabel}</span>
              {active && (
                <span className="mt-0.5 h-0.5 w-6 rounded-full bg-violet-500" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
