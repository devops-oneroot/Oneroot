"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { z } from "zod";
import toast from "react-hot-toast";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FormField } from "@/components/leads/FormField";
import { fetchTeamMembers } from "@/lib/api";
import { inputClass } from "@/lib/formCommon";
import {
  TASK_PRIORITIES,
  todayDateInputValue,
  type Task,
  type TaskInput,
} from "@/lib/tasks";

const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().trim().optional(),
  assignedTo: z.string().trim().min(1, "Choose who this task is for"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the date this must be completed by"),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface AssignTaskModalProps {
  open: boolean;
  onClose: () => void;
  /** Pass a task to edit it; omit to assign a new one. */
  task?: Task | null;
  onSubmit: (data: TaskInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function AssignTaskModal({
  open,
  onClose,
  task = null,
  onSubmit,
  isSubmitting,
}: AssignTaskModalProps) {
  const isEditing = Boolean(task);

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "",
      priority: "medium",
      dueDate: todayDateInputValue(),
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      assignedTo: task?.assignedTo ?? "",
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate ?? todayDateInputValue(),
    });
  }, [open, task, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0e1e] px-4 py-3 text-white sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo surface="on-dark" className="hidden h-8 w-28 sm:block" />
            <h2 className="truncate text-lg font-semibold">
              {isEditing ? "Edit Task" : "Assign Task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-300 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(
            async (values) => {
              await onSubmit({
                title: values.title,
                description: values.description ?? "",
                assignedTo: values.assignedTo,
                priority: values.priority,
                dueDate: values.dueDate,
              });
              reset();
              onClose();
            },
            (fieldErrors) => {
              const first = Object.values(fieldErrors).find(
                (error) => error?.message
              );
              toast.error(first?.message ?? "Please fix the highlighted fields.");
            }
          )}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-4 p-4 sm:p-6">
            <FormField label="Task *" error={errors.title?.message}>
              <input
                type="text"
                placeholder="e.g. Call Sri Balaji Traders about the 5 MT quote"
                autoFocus
                {...register("title")}
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Details"
              error={errors.description?.message}
            >
              <textarea
                rows={3}
                placeholder="What exactly needs to be done?"
                {...register("description")}
                className={`${inputClass} resize-y`}
              />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Assign to *"
                error={errors.assignedTo?.message}
              >
                <select {...register("assignedTo")} className={inputClass}>
                  <option value="">Select team member</option>
                  {team.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Priority *" error={errors.priority?.message}>
                <select {...register("priority")} className={inputClass}>
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Date to complete *"
                error={errors.dueDate?.message}
              >
                <input
                  type="date"
                  {...register("dueDate")}
                  className={inputClass}
                />
              </FormField>
            </div>

            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              The task appears only for the person you assign it to. Its Alert
              colour follows the due date on its own — green while there is
              time, yellow two days out, red once it is late.
            </p>
          </div>

          <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
