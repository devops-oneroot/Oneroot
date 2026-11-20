"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  addTaskUpdate,
  createTask,
  deleteTask,
  fetchTasks,
  fetchTeamMembers,
  updateTask,
  updateTaskStatus,
} from "@/lib/api";
import {
  TASK_ALERTS,
  TASK_STATUSES,
  alertMeta,
  dueLabel,
  formatDueDate,
  priorityMeta,
  type Task,
  type TaskAlertId,
  type TaskInput,
  type TaskStatusId,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { AssignTaskModal } from "./AssignTaskModal";
import { TaskDetailPanel } from "./TaskDetailPanel";

function errorMessage(err: unknown, fallback: string): string {
  return axios.isAxiosError(err) &&
    typeof err.response?.data?.message === "string"
    ? err.response.data.message
    : fallback;
}

interface TaskDashboardProps {
  createTrigger?: number;
}

export function TaskDashboard({ createTrigger = 0 }: TaskDashboardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [alertFilter, setAlertFilter] = useState<TaskAlertId | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // The header "Assign Task" button bumps createTrigger — open a blank form.
  const [lastCreateTrigger, setLastCreateTrigger] = useState(createTrigger);
  if (createTrigger !== lastCreateTrigger) {
    setLastCreateTrigger(createTrigger);
    if (createTrigger > 0 && isAdmin) {
      setEditingTask(null);
      setModalOpen(true);
    }
  }

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: isAdmin,
  });

  const {
    data: tasks = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tasks", isAdmin ? assigneeFilter : "mine"],
    queryFn: () =>
      fetchTasks(isAdmin && assigneeFilter ? { assignedTo: assigneeFilter } : {}),
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task-summary"] });
  };

  const createMutation = useMutation({
    mutationFn: (input: TaskInput) => createTask(input),
    onSuccess: (task) => {
      invalidateTasks();
      toast.success(`Task assigned to ${task.assignedToName}`);
      closeModal();
    },
    onError: (err) => toast.error(errorMessage(err, "Failed to assign task")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskInput> }) =>
      updateTask(id, input),
    onSuccess: () => {
      invalidateTasks();
      toast.success("Task updated");
      closeModal();
    },
    onError: (err) => toast.error(errorMessage(err, "Failed to update task")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatusId }) =>
      updateTaskStatus(id, status),
    onSuccess: (task) => {
      invalidateTasks();
      toast.success(
        task.status === "completed"
          ? "Task completed"
          : task.status === "in_progress"
            ? "Marked in progress"
            : "Moved back to pending"
      );
      setActionId(null);
    },
    onError: (err) => {
      toast.error(errorMessage(err, "Failed to update task"));
      setActionId(null);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { text: string; status?: TaskStatusId };
    }) => addTaskUpdate(id, input),
    onSuccess: () => {
      invalidateTasks();
      toast.success("Update added");
    },
    onError: (err) => toast.error(errorMessage(err, "Failed to add update")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      invalidateTasks();
      toast.success("Task deleted");
      setActionId(null);
    },
    onError: (err) => {
      toast.error(errorMessage(err, "Failed to delete task"));
      setActionId(null);
    },
  });

  const counts = useMemo(() => {
    const base: Record<TaskAlertId, number> = {
      overdue: 0,
      due_soon: 0,
      on_track: 0,
      completed: 0,
    };
    for (const task of tasks) base[task.alert] += 1;
    return base;
  }, [tasks]);

  const visibleTasks = useMemo(
    () =>
      alertFilter === "all"
        ? tasks
        : tasks.filter((task) => task.alert === alertFilter),
    [tasks, alertFilter]
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const changeStatus = (task: Task, status: TaskStatusId) => {
    if (status === task.status) return;
    setActionId(task._id);
    statusMutation.mutate({ id: task._id, status });
  };

  // Read the open task back out of the list so it refreshes after each update.
  const openTask = openTaskId
    ? (tasks.find((task) => task._id === openTaskId) ?? null)
    : null;

  const handleDelete = (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setActionId(task._id);
    deleteMutation.mutate(task._id);
  };

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-600">
          {isAdmin
            ? "Assign a task to one person with a priority and a date to complete. They see only their own tasks."
            : "Tasks assigned to you. Work the red and yellow ones first — you do not need to scan the whole list."}
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Assign task
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAlertFilter("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            alertFilter === "all"
              ? "bg-slate-900 text-white ring-1 ring-slate-900"
              : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
          )}
        >
          All · {tasks.length}
        </button>

        {TASK_ALERTS.map((alert) => {
          const active = alertFilter === alert.id;
          return (
            <button
              key={alert.id}
              type="button"
              onClick={() => setAlertFilter(active ? "all" : alert.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active ? alert.activeChipClass : alert.chipClass
              )}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  active ? "bg-white" : alert.dot
                )}
              />
              {alert.label} · {counts[alert.id]}
            </button>
          );
        })}

        {isAdmin && (
          <select
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="">All team members</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading && (
        <p className="py-12 text-center text-slate-500">Loading tasks…</p>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Could not load tasks. Make sure the backend is running.
        </div>
      )}

      {!isLoading && !isError && visibleTasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-[#f8f9fa] py-16 text-center">
          <p className="text-slate-500">
            {tasks.length === 0
              ? isAdmin
                ? "No tasks assigned yet."
                : "No tasks assigned to you yet."
              : `No ${alertFilter === "all" ? "" : alertMeta(alertFilter as TaskAlertId).label.toLowerCase()} tasks.`}
          </p>
          {isAdmin && tasks.length === 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-3 text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              Assign the first task
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && visibleTasks.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[60rem] border-collapse text-sm">
            <thead>
              <tr className="bg-[#f1f3f5] text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5">Alert</th>
                <th className="px-3 py-2.5">Task</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Date to complete</th>
                <th className="px-3 py-2.5">Status</th>
                {isAdmin && <th className="px-3 py-2.5">Assigned to</th>}
                <th className="px-3 py-2.5">Assigned by</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((task) => {
                const alert = alertMeta(task.alert);
                const priority = priorityMeta(task.priority);
                const busy = actionId === task._id;
                const done = task.status === "completed";

                return (
                  <tr
                    key={task._id}
                    className={cn(
                      "border-t border-slate-100 align-top",
                      alert.rowClass
                    )}
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
                          alert.chipClass
                        )}
                      >
                        <span className={cn("h-2.5 w-2.5 rounded-full", alert.dot)} />
                        {alert.label}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenTaskId(task._id)}
                        className="block text-left"
                      >
                        <p
                          className={cn(
                            "font-semibold text-slate-900 hover:text-violet-700",
                            done && "text-slate-500 line-through"
                          )}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-0.5 max-w-md text-xs text-slate-500">
                            {task.description}
                          </p>
                        )}
                        {task.updates.length > 0 && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-700">
                            <MessageSquare className="h-3 w-3" />
                            {task.updates.length}{" "}
                            {task.updates.length === 1 ? "update" : "updates"}
                          </p>
                        )}
                      </button>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                          priority.badgeClass
                        )}
                      >
                        {priority.label}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <p className="font-medium text-slate-800">
                        {formatDueDate(task.dueDate)}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          task.alert === "overdue"
                            ? "font-semibold text-red-600"
                            : task.alert === "due_soon"
                              ? "font-semibold text-amber-700"
                              : "text-slate-500"
                        )}
                      >
                        {done
                          ? task.completedByName
                            ? `Done by ${task.completedByName}`
                            : "Done"
                          : dueLabel(task)}
                      </p>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(event) =>
                          changeStatus(task, event.target.value as TaskStatusId)
                        }
                        disabled={busy}
                        aria-label={`Status of ${task.title}`}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-xs font-semibold disabled:opacity-60",
                          done
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : task.status === "in_progress"
                              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                              : "border-slate-300 bg-white text-slate-700"
                        )}
                      >
                        {TASK_STATUSES.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {isAdmin && (
                      <td className="px-3 py-3 whitespace-nowrap text-slate-700">
                        {task.assignedToName}
                      </td>
                    )}

                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                      {task.assignedByName}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setOpenTaskId(task._id)}
                          className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Update
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTask(task);
                                setModalOpen(true);
                              }}
                              className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50"
                              aria-label={`Edit ${task.title}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(task)}
                              disabled={busy}
                              className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
                              aria-label={`Delete ${task.title}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TaskDetailPanel
        task={openTask}
        onClose={() => setOpenTaskId(null)}
        isSubmitting={updateNoteMutation.isPending || statusMutation.isPending}
        onAddUpdate={async (input) => {
          if (!openTask) return;
          await updateNoteMutation.mutateAsync({ id: openTask._id, input });
        }}
        onStatusChange={async (status) => {
          if (!openTask) return;
          await statusMutation.mutateAsync({ id: openTask._id, status });
        }}
      />

      {isAdmin && (
        <AssignTaskModal
          open={modalOpen}
          onClose={closeModal}
          task={editingTask}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSubmit={async (input) => {
            if (editingTask) {
              await updateMutation.mutateAsync({ id: editingTask._id, input });
            } else {
              await createMutation.mutateAsync(input);
            }
          }}
        />
      )}
    </div>
  );
}
