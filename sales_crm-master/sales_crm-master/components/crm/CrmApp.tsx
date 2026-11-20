"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { CrmShell, type CrmTab } from "./CrmShell";
import { LeadUrlSync } from "./LeadUrlSync";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { FollowUpTable } from "@/components/leads/FollowUpTable";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadDetailPanel } from "@/components/leads/LeadDetailPanel";
import { KanbanBoard } from "@/components/activity/KanbanBoard";
import { MyDaysDashboard } from "@/components/activity/MyDaysDashboard";
import { OutreachReportDashboard } from "@/components/activity/OutreachReportDashboard";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { AddSupplierModal } from "@/components/suppliers/AddSupplierModal";
import { SupplierDetailPanel } from "@/components/suppliers/SupplierDetailPanel";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { AddImporterModal } from "@/components/importers/AddImporterModal";
import { ImporterDetailPanel } from "@/components/importers/ImporterDetailPanel";
import { ImportersTable } from "@/components/importers/ImportersTable";
import { BuysDashboard } from "@/components/buys/BuysDashboard";
import { DailyPriceDashboard } from "@/components/dailyPrice/DailyPriceDashboard";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";
import axios from "axios";
import {
  createImporter,
  createLead,
  createSupplier,
  fetchImporters,
  fetchLeads,
  fetchSuppliers,
  fetchTaskSummary,
} from "@/lib/api";
import { invalidateLeadActivity } from "@/lib/invalidateActivity";
import type {
  CreateImporterInput,
  CreateLeadInput,
  CreateSupplierInput,
  Importer,
  Lead,
  Supplier,
} from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export function CrmApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<CrmTab>("leads");
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [importerModalOpen, setImporterModalOpen] = useState(false);
  const [dailyPriceCreateTrigger, setDailyPriceCreateTrigger] = useState(0);
  const [taskCreateTrigger, setTaskCreateTrigger] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedImporter, setSelectedImporter] = useState<Importer | null>(null);
  const [importerInitialTab, setImporterInitialTab] = useState<"profile" | "emails">("profile");
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (tab === "followup" && !isAdmin) {
      setTab("leads");
    }
  }, [tab, isAdmin]);

  const handleLogout = () => {
    queryClient.clear();
    logout();
  };

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
  });

  const {
    data: suppliers = [],
    isLoading: suppliersLoading,
    isError: suppliersError,
  } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetchSuppliers(),
    enabled: tab === "suppliers",
  });

  const {
    data: importers = [],
    isLoading: importersLoading,
    isError: importersError,
    refetch: refetchImporters,
  } = useQuery({
    queryKey: ["importers"],
    queryFn: () => fetchImporters(),
    enabled: tab === "importers",
  });

  const { data: taskSummary } = useQuery({
    queryKey: ["task-summary"],
    queryFn: () => fetchTaskSummary(),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: () => {
      invalidateLeadActivity(queryClient);
      toast.success("Lead created — appears in Identity on Activity board");
      setTab("activity");
    },
    onError: (err) => {
      const message =
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Failed to create lead";
      toast.error(message);
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (input: CreateSupplierInput) => createSupplier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully");
    },
    onError: () => toast.error("Failed to add supplier"),
  });

  const createImporterMutation = useMutation({
    mutationFn: (input: CreateImporterInput) => createImporter(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importers"] });
      toast.success("Importer added successfully");
    },
    onError: (err) => {
      const message =
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Failed to add importer";
      toast.error(message);
    },
  });

  const handleOpenLeadFromUrl = useCallback((lead: Lead, nextTab: CrmTab) => {
    setTab(nextTab);
    setSelectedLead(lead);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <LeadUrlSync leads={leads} onOpenLead={handleOpenLeadFromUrl} />
      </Suspense>
      <Toaster
        position="top-center"
        containerClassName="!top-[env(safe-area-inset-top,0px)] sm:!top-4"
        toastOptions={{ className: "text-sm max-w-[calc(100vw-2rem)]" }}
      />
      <CrmShell
        activeTab={tab}
        onTabChange={setTab}
        onCreateLead={() => setModalOpen(true)}
        onAddSupplier={() => setSupplierModalOpen(true)}
        onAddImporter={() => setImporterModalOpen(true)}
        onAddDailyPrice={() =>
          setDailyPriceCreateTrigger((n) => n + 1)
        }
        onAssignTask={() => setTaskCreateTrigger((n) => n + 1)}
        onLogout={handleLogout}
        userName={user?.name ?? "User"}
        userPhone={user?.phone}
        isAdmin={isAdmin}
        taskAlertCount={taskSummary?.needsAttention ?? 0}
      >
        {tab === "leads" && (
          <div>
            {isLoading && <p className="text-slate-500">Loading leads…</p>}
            {isError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                Could not connect to API. Start the backend with{" "}
                <code className="rounded bg-red-100 px-1">npm run dev</code> in
                the backend folder.
              </div>
            )}
            {!isLoading && !isError && (
              <LeadsTable
                leads={leads}
                onSelectLead={setSelectedLead}
                isAdmin={isAdmin}
              />
            )}
          </div>
        )}

        {tab === "activity" && <KanbanBoard />}

        {tab === "outreach" && <OutreachReportDashboard />}

        {tab === "mydays" && <MyDaysDashboard />}

        {tab === "followup" && isAdmin && (
          <div>
            {isLoading && (
              <p className="p-6 text-slate-500">Loading follow-ups…</p>
            )}
            {isError && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                Could not load leads. Start the backend with{" "}
                <code className="rounded bg-red-100 px-1">npm run dev</code>.
              </div>
            )}
            {!isLoading && !isError && (
              <FollowUpTable leads={leads} onSelectLead={setSelectedLead} />
            )}
          </div>
        )}

        {tab === "analytics" && (
          <div>
            {isLoading && (
              <p className="p-6 text-slate-500">Loading analytics…</p>
            )}
            {isError && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                Could not load data. Start the backend with{" "}
                <code className="rounded bg-red-100 px-1">npm run dev</code>.
              </div>
            )}
            {!isLoading && !isError && <AnalyticsDashboard leads={leads} />}
          </div>
        )}

        {tab === "suppliers" && (
          <div>
            {suppliersLoading && (
              <p className="p-6 text-slate-500">Loading suppliers…</p>
            )}
            {suppliersError && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                Could not load suppliers. Start the backend with{" "}
                <code className="rounded bg-red-100 px-1">npm run dev</code>.
              </div>
            )}
            {!suppliersLoading && !suppliersError && (
              <SuppliersTable
                suppliers={suppliers}
                onSelectSupplier={setSelectedSupplier}
              />
            )}
          </div>
        )}

        {tab === "importers" && (
          <div>
            {importersLoading && (
              <p className="p-6 text-slate-500">Loading importers…</p>
            )}
            {importersError && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                Could not load importers. Start the backend with{" "}
                <code className="rounded bg-red-100 px-1">npm run dev</code>.
              </div>
            )}
            {!importersLoading && !importersError && (
              <ImportersTable
                importers={importers}
                onSelectImporter={(item, tab = "profile") => {
                  setSelectedImporter(item);
                  setImporterInitialTab(tab);
                }}
                onAddImporter={() => setImporterModalOpen(true)}
                onRefresh={() => {
                  void refetchImporters();
                }}
              />
            )}
          </div>
        )}

        {tab === "match" && <BuysDashboard />}

        {tab === "dailyprice" && (
          <DailyPriceDashboard createTrigger={dailyPriceCreateTrigger} />
        )}

        {tab === "tasks" && <TaskDashboard createTrigger={taskCreateTrigger} />}
      </CrmShell>

      <CreateLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isSubmitting={createMutation.isPending}
      />

      <AddSupplierModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSubmit={async (data) => {
          await createSupplierMutation.mutateAsync(data);
        }}
        isSubmitting={createSupplierMutation.isPending}
      />

      <LeadDetailPanel
        lead={
          selectedLead
            ? leads.find((l) => l._id === selectedLead._id) ?? selectedLead
            : null
        }
        onClose={() => setSelectedLead(null)}
      />

      <SupplierDetailPanel
        supplier={
          selectedSupplier
            ? suppliers.find((s) => s._id === selectedSupplier._id) ??
              selectedSupplier
            : null
        }
        onClose={() => setSelectedSupplier(null)}
      />

      <AddImporterModal
        open={importerModalOpen}
        onClose={() => setImporterModalOpen(false)}
        onSubmit={async (data) => {
          await createImporterMutation.mutateAsync(data);
        }}
        isSubmitting={createImporterMutation.isPending}
      />

      <ImporterDetailPanel
        importer={
          selectedImporter
            ? importers.find((e) => e._id === selectedImporter._id) ??
              selectedImporter
            : null
        }
        initialTab={importerInitialTab}
        onClose={() => setSelectedImporter(null)}
      />
    </>
  );
}
