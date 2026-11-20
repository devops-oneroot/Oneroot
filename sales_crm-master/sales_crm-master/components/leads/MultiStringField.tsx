"use client";

import { Plus, X } from "lucide-react";
import type { Control, FieldErrors, FieldPath } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { inputClass } from "@/lib/leadForm";

interface MultiStringFieldProps {
  control: Control<LeadFormInput>;
  name: FieldPath<LeadFormInput>;
  label: string;
  placeholder?: string;
  type?: "text" | "email";
  errors?: FieldErrors<LeadFormInput>;
  errorMessage?: string;
  /** Text on the add button — defaults to "Add another". */
  addLabel?: string;
  /** Values that render read-only and cannot be removed; new rows stay editable. */
  lockedValues?: string[];
}

export function MultiStringField({
  control,
  name,
  label,
  placeholder,
  type = "text",
  errorMessage,
  addLabel = "Add another",
  lockedValues = [],
}: MultiStringFieldProps) {
  const locked = new Set(lockedValues.map((v) => v.trim()));
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const items =
            Array.isArray(field.value) && field.value.length
              ? field.value
              : [""];

          const update = (next: string[]) => {
            field.onChange(next.length ? next : [""]);
          };

          return (
            <div className="space-y-2">
              {items.map((value, index) => {
                const isLocked = locked.has(String(value).trim()) && String(value).trim() !== "";
                return (
                <div key={index} className="flex gap-2">
                  <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    readOnly={isLocked}
                    title={isLocked ? "Saved — only an admin can change this" : undefined}
                    onChange={(e) => {
                      if (isLocked) return;
                      const next = [...items];
                      next[index] = e.target.value;
                      update(next);
                    }}
                    className={`${inputClass} min-w-0 flex-1${isLocked ? " cursor-not-allowed bg-slate-100 text-slate-600" : ""}`}
                  />
                  {items.length > 1 && !isLocked && (
                    <button
                      type="button"
                      onClick={() => update(items.filter((_, i) => i !== index))}
                      className="shrink-0 rounded-lg border border-slate-200 px-2 text-slate-500 hover:bg-slate-50 hover:text-red-600"
                      aria-label={`Remove ${label}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                );
              })}
              <button
                type="button"
                onClick={() => update([...items, ""])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                <Plus className="h-3.5 w-3.5" />
                {addLabel}
              </button>
            </div>
          );
        }}
      />
      {errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
