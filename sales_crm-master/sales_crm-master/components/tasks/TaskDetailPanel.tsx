"use client";

import { useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  TASK_STATUSES,
  alertMeta,
  dueLabel,
  formatDueDate,
  formatUpdatedAt,
  priorityMeta,
  statusMeta,
  type Task,
  type TaskStatusId,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  /** Post a progress note, optionally moving the status at the same time. */
  onAddUpdate: (input: { text: string; status?: TaskStatusId }) => Promise<void>;
  onStatusChange: (status: TaskStatusId) => Promise<void>;
  isSubmitting?: boolean;
}

export function TaskDetailPanel({
  task,
  onClose,
  onAddUpdate,
  onStatusChange,
  isSubmitting,
}: TaskDetailPanelProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<TaskStatusId>("pending");

  // Reset the draft when a different task is opened — not on every refetch,
  // so a note being typed survives the list refreshing underneath.
  const [openId, setOpenId] = useState(task?._id ?? null);
  if ((task?._id ?? null) !== openId) {
    setOpenId(task?._id ?? null);
    setText("");
    setStatus(task?.status ?? "pending");
  }

  if (!task) return null;

  const alert = alertMeta(task.alert);
  const priority = priorityMeta(task.priority);
  const updates = [...task.updates].reverse();
  const statusChanged = status !== task.status;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const note = text.trim();

    if (!note && statusChanged) {
      await onStatusChange(status);
      return;
    }
    if (!note) return;

    await onAddUpdate({ text: note, status: statusChanged ? status : undefined });
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0e1e] px-4 py-3 text-white sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo surface="on-dark" className="hidden h-8 w-28 sm:block" />
            <h2 className="truncate text-lg font-semibold">Task</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-300 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
                alert.chipClass
              )}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", alert.dot)} />
              {alert.label}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                priority.badgeClass
              )}
            >
              {priority.label}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                statusMeta(task.status).badgeClass
              )}
            >
              {statusMeta(task.status).label}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-900">{task.title}</h3>
          {task.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
              {task.description}
            </p>
          )}

          <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">
                Date to complete
              </dt>
              <dd className="font-semibold text-slate-800">
                {formatDueDate(task.dueDate)}
              </dd>
              <dd
                className={cn(
                  "text-xs",
                  task.alert === "overdue"
                    ? "font-semibold text-red-600"
                    : task.alert === "due_soon"
                      ? "font-semibold text-amber-700"
                      : "text-slate-500"
                )}
              >
                {dueLabel(task)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Assigned to</dt>
              <dd className="font-semibold text-slate-800">
                {task.assignedToName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Assigned by</dt>
              <dd className="font-semibold text-slate-800">
                {task.assignedByName}
              </dd>
            </div>
          </dl>

          <form onSubmit={handleSubmit} className="mt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What is happening?
            </h4>
            <textarea
              rows={3}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="e.g. Spoke to the buyer, they want a revised quote by Friday"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Status
              </label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatusId)
                }
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                {TASK_STATUSES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={isSubmitting || (!text.trim() && !statusChanged)}
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                <MessageSquarePlus className="h-4 w-4" />
                {isSubmitting
                  ? "Saving…"
                  : !text.trim() && statusChanged
                    ? "Update status"
                    : "Add update"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress updates ({updates.length})
            </h4>

            {updates.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-[#f8f9fa] px-3 py-6 text-center text-sm text-slate-500">
                No updates yet. Add the first one above.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {updates.map((update) => (
                  <li
                    key={update._id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <p className="whitespace-pre-line text-sm text-slate-800">
                      {update.text}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {update.author || "User"} ·{" "}
                      {formatUpdatedAt(update.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
