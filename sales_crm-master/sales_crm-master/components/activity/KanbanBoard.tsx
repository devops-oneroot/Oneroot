"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchLeads, fetchTeamMembers, updateLeadStatus } from "@/lib/api";
import { invalidateLeadActivity } from "@/lib/invalidateActivity";
import {
  ACTIVITY_BOARD_STATUSES,
  activityBoardColumnForStatus,
  type Lead,
  type LeadStatus,
  type TeamMember,
} from "@/lib/types";
import {
  isIndiaCountry,
  MARKET_FILTERS,
  matchesMarketFilter,
  type MarketFilter,
} from "@/lib/countries";
import {
  cn,
  compareLeadsByFollowUp,
  buildReassignTeamNames,
  leadMatchesTeamMember,
  normalizePersonName,
} from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import { DailyActivityModal } from "./DailyActivityModal";
import { CountryFilterSelect } from "@/components/leads/CountryFilterSelect";
import { LeadDetailPanel } from "@/components/leads/LeadDetailPanel";
import { IdleLeadAlerts } from "./IdleLeadAlerts";
import { LeadStatusFilterSelect } from "@/components/leads/LeadStatusFilterSelect";
import {
  matchesCountryFilter,
  matchesLeadStatusFilter,
  matchesNameSearch,
} from "@/lib/leadFilters";
import { useAuth } from "@/providers/AuthProvider";

type ResponsibleFilter = "all" | string;

function buildTeamOptions(team: TeamMember[], leads: Lead[]): TeamMember[] {
  const members = [...team];
  const knownNames = new Set(team.map((m) => normalizePersonName(m.name)));

  for (const lead of leads) {
    const name = lead.responsiblePerson?.trim();
    if (!name) continue;
    if (knownNames.has(normalizePersonName(name))) continue;

    members.push({
      id: `name:${normalizePersonName(name)}`,
      name,
    });
    knownNames.add(normalizePersonName(name));
  }

  return members.sort((a, b) => a.name.localeCompare(b.name));
}

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] =
    useState<ResponsibleFilter>("all");
  const [nameSearch, setNameSearch] = useState("");

  const { data: leads = [], isLoading, isError } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
  });

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
  });

  const teamOptions = useMemo(
    () => buildTeamOptions(team, leads),
    [team, leads]
  );

  const reassignTeamNames = useMemo(
    () => buildReassignTeamNames(team, leads),
    [team, leads]
  );

  const selectedMember = useMemo(
    () =>
      responsibleFilter === "all"
        ? null
        : teamOptions.find((m) => m.id === responsibleFilter) ?? null,
    [responsibleFilter, teamOptions]
  );
  const responsibleDisplayName = user?.name?.trim() || "You";

  // The follow-up alerts follow the Responsible person chips: pick a person
  // and the three counts (and their lists) are that person's leads only.
  const alertLeads = useMemo(
    () =>
      selectedMember
        ? leads.filter((lead) => leadMatchesTeamMember(lead, selectedMember))
        : leads,
    [leads, selectedMember]
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, status),
    onSuccess: () => {
      invalidateLeadActivity(queryClient);
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        if (!matchesNameSearch(lead, nameSearch)) return false;
        if (!matchesMarketFilter(lead.country, marketFilter)) return false;
        if (!matchesCountryFilter(lead, countryFilter)) return false;
        if (!matchesLeadStatusFilter(lead, leadStatusFilter)) return false;
        if (selectedMember && !leadMatchesTeamMember(lead, selectedMember)) {
          return false;
        }
        return true;
      }),
    [
      leads,
      nameSearch,
      marketFilter,
      countryFilter,
      leadStatusFilter,
      selectedMember,
    ]
  );

  const marketFilterCounts = useMemo(() => {
    const base = leads.filter((lead) => {
      if (!matchesNameSearch(lead, nameSearch)) return false;
      if (!matchesCountryFilter(lead, countryFilter)) return false;
      if (!matchesLeadStatusFilter(lead, leadStatusFilter)) return false;
      if (selectedMember && !leadMatchesTeamMember(lead, selectedMember)) {
        return false;
      }
      return true;
    });
    const counts: Record<MarketFilter, number> = {
      all: base.length,
      india: 0,
      international: 0,
    };
    for (const lead of base) {
      if (isIndiaCountry(lead.country)) counts.india += 1;
      else if (lead.country?.trim()) counts.international += 1;
    }
    return counts;
  }, [leads, nameSearch, countryFilter, leadStatusFilter, selectedMember]);

  const responsibleFilterCounts = useMemo(() => {
    const base = leads.filter((lead) => {
      if (!matchesNameSearch(lead, nameSearch)) return false;
      if (!matchesMarketFilter(lead.country, marketFilter)) return false;
      if (!matchesCountryFilter(lead, countryFilter)) return false;
      if (!matchesLeadStatusFilter(lead, leadStatusFilter)) return false;
      return true;
    });
    const counts: Record<string, number> = { all: base.length };
    for (const member of teamOptions) {
      counts[member.id] = base.filter((lead) =>
        leadMatchesTeamMember(lead, member)
      ).length;
    }
    return counts;
  }, [leads, nameSearch, marketFilter, countryFilter, leadStatusFilter, teamOptions]);

  const columns = useMemo(() => {
    const grouped = Object.fromEntries(
      ACTIVITY_BOARD_STATUSES.map((s) => [s.id, [] as Lead[]])
    ) as Record<LeadStatus, Lead[]>;
    for (const lead of filteredLeads) {
      const column = activityBoardColumnForStatus(
        lead.status,
        lead.pipelineStatus
      );
      grouped[column]?.push(lead);
    }
    for (const status of Object.keys(grouped) as LeadStatus[]) {
      grouped[status].sort(compareLeadsByFollowUp);
    }
    return grouped;
  }, [filteredLeads]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as LeadStatus;
    const lead = leads.find((l) => l._id === draggableId);
    if (!lead || lead.status === newStatus) return;

    queryClient.setQueryData<Lead[]>(["leads"], (old = []) =>
      old.map((l) => (l._id === draggableId ? { ...l, status: newStatus } : l))
    );

    statusMutation.mutate({ id: draggableId, status: newStatus });
    toast.success(
      `Moved to ${ACTIVITY_BOARD_STATUSES.find((s) => s.id === newStatus)?.label}`
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[min(560px,calc(100dvh-12rem))] min-h-[280px] items-center justify-center p-6 text-slate-500">
        Loading board…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Could not load leads. Make sure the backend is running on port 5000.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-4 lg:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">Activity board</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Drag a card to move it along the pipeline
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDailyOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <ClipboardList className="h-4 w-4" />
            {isAdmin && selectedMember
              ? `${selectedMember.name}'s day`
              : "My day"}
          </button>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Needs follow-up
          </p>
          <IdleLeadAlerts
            leads={alertLeads}
            onSelectLead={setSelectedLead}
            scopeLabel={selectedMember ? selectedMember.name : undefined}
          />
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Market
          </p>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
            {MARKET_FILTERS.map(({ id, label }) => {
              const active = marketFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMarketFilter(id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "ml-1.5 tabular-nums",
                      active ? "text-violet-200" : "text-slate-400"
                    )}
                  >
                    ({marketFilterCounts[id]})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[12rem] flex-1">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Search by name
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Company or lead name…"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-[#f8f9fa] py-2 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
            </div>
          </div>
          <div className="min-w-[12rem] flex-1">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Country
            </p>
            <CountryFilterSelect
              leads={leads}
              value={countryFilter}
              onChange={setCountryFilter}
              className="w-full rounded-lg border border-slate-200 bg-[#f8f9fa] px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
            />
          </div>
          <div className="min-w-[12rem] flex-1">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Lead status
            </p>
            <LeadStatusFilterSelect
              value={leadStatusFilter}
              onChange={setLeadStatusFilter}
              className="w-full rounded-lg border border-slate-200 bg-[#f8f9fa] px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Responsible person
          </p>
          {isAdmin ? (
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
              <button
                type="button"
                onClick={() => setResponsibleFilter("all")}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  responsibleFilter === "all"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    responsibleFilter === "all"
                      ? "text-emerald-200"
                      : "text-slate-400"
                  )}
                >
                  ({responsibleFilterCounts.all})
                </span>
              </button>
              {teamOptions.map((member) => {
                const active = responsibleFilter === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setResponsibleFilter(member.id)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {member.name}
                    <span
                      className={cn(
                        "ml-1.5 tabular-nums",
                        active ? "text-emerald-200" : "text-slate-400"
                      )}
                    >
                      ({responsibleFilterCounts[member.id] ?? 0})
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
              <div className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                {responsibleDisplayName}
                <span className="ml-1.5 tabular-nums text-emerald-200">
                  ({responsibleFilterCounts.all})
                </span>
              </div>
            </div>
          )}
        </div>

        {(nameSearch.trim() !== "" ||
          marketFilter !== "all" ||
          countryFilter !== "all" ||
          leadStatusFilter !== "all" ||
          responsibleFilter !== "all") &&
          filteredLeads.length === 0 && (
            <p className="text-xs text-slate-500">
              No leads match these filters. Reset filters or try All.
            </p>
          )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="h-[min(560px,calc(100dvh-14rem))] min-h-[280px]">
          <div className="flex h-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain p-3 [-webkit-overflow-scrolling:touch] sm:gap-4 sm:p-4 lg:p-5">
          {ACTIVITY_BOARD_STATUSES.map((col) => (
            <div
              key={col.id}
              className="flex h-full w-[min(85vw,18rem)] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-200 sm:w-72"
            >
              <div
                className="border-b border-slate-200 bg-[#f1f3f5] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-700"
              >
                <span style={{ color: col.color }}>{col.label}</span>
                <span className="ml-2 font-normal text-slate-500">
                  ({columns[col.id]?.length ?? 0})
                </span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[#f8f9fa] p-3 transition-colors ${
                      snapshot.isDraggingOver ? "bg-violet-50" : ""
                    }`}
                  >
                    {(columns[col.id] ?? []).map((lead, index) => (
                      <Draggable
                        key={lead._id}
                        draggableId={lead._id}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={
                              dragSnapshot.isDragging ? "rotate-1 opacity-90" : ""
                            }
                          >
                            <KanbanCard
                              lead={lead}
                              onClick={() => setSelectedLead(lead)}
                              isAdmin={isAdmin}
                              team={reassignTeamNames}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {(columns[col.id]?.length ?? 0) === 0 && (
                      <p className="py-8 text-center text-xs text-slate-400">
                        Drop leads here
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
          </div>
        </div>
      </DragDropContext>

      <LeadDetailPanel
        lead={selectedLead ? leads.find((l) => l._id === selectedLead._id) ?? selectedLead : null}
        onClose={() => setSelectedLead(null)}
      />

      <DailyActivityModal
        open={dailyOpen}
        onClose={() => setDailyOpen(false)}
        responsiblePerson={isAdmin ? selectedMember?.name : undefined}
        isAdmin={isAdmin}
      />
    </>
  );
}
