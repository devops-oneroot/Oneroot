"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Pencil, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  approveDailyPriceColumn,
  createDailyPrice,
  fetchDailyPrices,
  rejectDailyPriceColumn,
  updateDailyPrice,
} from "@/lib/api";
import {
  DAILY_PRICE_FARMING_METHODS,
  getMethodPriceMeta,
  normalizeDailyPriceByMethod,
  type DailyPriceEntry,
  type DailyPriceFarmingMethodId,
  type DailyPriceLocationId,
} from "@/lib/dailyPrice";
import { useAuth } from "@/providers/AuthProvider";
import { DailyPriceModal } from "./DailyPriceModal";
import { DailyPriceTable } from "./DailyPriceTable";

function formatDisplayDate(date: string): string {
  try {
    return format(new Date(`${date}T12:00:00`), "EEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

function formatUpdatedAt(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}

interface DailyPriceDashboardProps {
  createTrigger?: number;
}

export function DailyPriceDashboard({
  createTrigger = 0,
}: DailyPriceDashboardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyPriceEntry | null>(
    null
  );
  const [editingMethod, setEditingMethod] =
    useState<DailyPriceFarmingMethodId | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  useEffect(() => {
    if (createTrigger > 0) {
      setEditingEntry(null);
      setEditingMethod(null);
      setModalOpen(true);
    }
  }, [createTrigger]);

  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ["daily-prices"],
    queryFn: fetchDailyPrices,
  });

  const createMutation = useMutation({
    mutationFn: createDailyPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-prices"] });
      toast.success("Daily price saved");
      closeModal();
    },
    onError: () => toast.error("Failed to save daily price"),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      method,
      location,
    }: {
      id: string;
      method: DailyPriceFarmingMethodId;
      location: DailyPriceLocationId;
    }) => approveDailyPriceColumn(id, { method, location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-prices"] });
      toast.success("Approved by Deelep sir");
      setActionKey(null);
    },
    onError: () => {
      toast.error("Failed to approve");
      setActionKey(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      method,
      location,
    }: {
      id: string;
      method: DailyPriceFarmingMethodId;
      location: DailyPriceLocationId;
    }) => rejectDailyPriceColumn(id, { method, location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-prices"] });
      toast.success("Marked as Wrong (rejected)");
      setActionKey(null);
    },
    onError: () => {
      toast.error("Failed to reject");
      setActionKey(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateDailyPrice>[1];
    }) => updateDailyPrice(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-prices"] });
      toast.success("Daily price updated");
      closeModal();
    },
    onError: () => toast.error("Failed to update daily price"),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
    setEditingMethod(null);
  };

  const openCreate = () => {
    setEditingEntry(null);
    setEditingMethod(null);
    setModalOpen(true);
  };

  const handleApprove = (
    entry: DailyPriceEntry,
    methodId: DailyPriceFarmingMethodId,
    locationId: DailyPriceLocationId
  ) => {
    setActionKey(`${entry._id}:${methodId}:${locationId}`);
    approveMutation.mutate({
      id: entry._id,
      method: methodId,
      location: locationId,
    });
  };

  const handleReject = (
    entry: DailyPriceEntry,
    methodId: DailyPriceFarmingMethodId,
    locationId: DailyPriceLocationId
  ) => {
    setActionKey(`${entry._id}:${methodId}:${locationId}`);
    rejectMutation.mutate({
      id: entry._id,
      method: methodId,
      location: locationId,
    });
  };

  const openEditMethod = (
    entry: DailyPriceEntry,
    methodId: DailyPriceFarmingMethodId
  ) => {
    setEditingEntry(entry);
    setEditingMethod(methodId);
    setModalOpen(true);
  };

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          <p>
            Locations as rows · Polish types as columns · Edit each farming
            method separately
          </p>
          <p className="mt-0.5 text-xs font-medium text-emerald-700">
            All users can edit and approve. Click{" "}
            <span className="font-bold">Right ✓</span> or{" "}
            <span className="font-bold">Wrong ✗</span> in each location row
            (Gundlupete, Erode, Salem, Sangli, Nizamabad) — shows Approved by
            Deelep sir.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Add daily price
        </button>
      </div>

      {isLoading && (
        <p className="py-12 text-center text-slate-500">Loading daily prices…</p>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Could not load daily prices. Make sure the backend is running.
        </div>
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-[#f8f9fa] py-16 text-center">
          <p className="text-slate-500">No daily prices yet.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            Add the first entry
          </button>
        </div>
      )}

      {!isLoading && !isError && entries.length > 0 && (
        <div className="space-y-6">
          {entries.map((entry) => (
            <section
              key={entry._id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="border-b border-slate-200 bg-[#f1f3f5] px-4 py-3">
                <p className="font-semibold text-slate-900">
                  {formatDisplayDate(entry.date)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Added by{" "}
                  <span className="font-semibold text-slate-800">
                    {entry.addedByName}
                  </span>
                  {" · "}
                  Last updated by{" "}
                  <span className="font-semibold text-slate-800">
                    {entry.updatedByName || entry.addedByName}
                  </span>
                  {entry.updatedAt && (
                    <span className="text-slate-500">
                      {" "}
                      · {formatUpdatedAt(entry.updatedAt)}
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-4 p-3 sm:p-4">
                {DAILY_PRICE_FARMING_METHODS.map((method) => (
                  <section
                    key={method.id}
                    className="overflow-hidden rounded-lg border border-slate-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[#f8f9fa] px-3 py-2.5 sm:px-4">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-violet-700">
                        {method.label}
                      </h3>
                      {user && (
                        <button
                          type="button"
                          onClick={() => openEditMethod(entry, method.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit {method.label}
                        </button>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <DailyPriceTable
                        prices={
                          normalizeDailyPriceByMethod(entry.prices)[method.id]
                        }
                        columnMeta={getMethodPriceMeta(entry, method.id)}
                        canApprove={!!user}
                        onApprove={(locationId) =>
                          handleApprove(entry, method.id, locationId)
                        }
                        onReject={(locationId) =>
                          handleReject(entry, method.id, locationId)
                        }
                        actionLocationId={
                          actionKey?.startsWith(`${entry._id}:${method.id}:`)
                            ? (actionKey.split(":").pop() as DailyPriceLocationId)
                            : null
                        }
                      />
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <DailyPriceModal
        open={modalOpen}
        onClose={closeModal}
        entry={editingEntry}
        editingMethod={editingMethod}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={async (input) => {
          if (editingEntry) {
            await updateMutation.mutateAsync({
              id: editingEntry._id,
              input,
            });
          } else {
            await createMutation.mutateAsync(input);
          }
        }}
      />
    </div>
  );
}
