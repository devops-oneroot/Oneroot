"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, Globe, Loader2, Mail, Phone, User, X } from "lucide-react";
import type { CreateLinkedInLeadInput } from "@/lib/types";

interface AddLinkedInLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLinkedInLeadInput) => Promise<void>;
  isSubmitting?: boolean;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-[#f8f9fa] px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/20";

export function AddLinkedInLeadModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddLinkedInLeadModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLinkedInLeadInput>({
    defaultValues: {
      country: "United States",
      connectionStatus: "not_connected",
      targetProducts: ["Turmeric"],
    },
  });

  if (!open) return null;

  const handleFormSubmit = async (data: CreateLinkedInLeadInput) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A66C2] text-white">
              <LinkedInIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Add LinkedIn Buyer Lead
              </h2>
              <p className="text-xs text-slate-500">
                Add spice sourcing leaders and procurement heads from LinkedIn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Full Name *
              </label>
              <input
                {...register("fullName", { required: "Full name is required" })}
                placeholder="e.g. David Nguyen"
                className={inputClass}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Company Name *
              </label>
              <input
                {...register("companyName", { required: "Company is required" })}
                placeholder="e.g. House Foods Vietnam"
                className={inputClass}
              />
              {errors.companyName && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                LinkedIn Profile URL *
              </label>
              <input
                {...register("profileUrl", {
                  required: "Profile URL is required",
                })}
                placeholder="https://www.linkedin.com/in/username"
                className={inputClass}
              />
              {errors.profileUrl && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.profileUrl.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Headline / Title
              </label>
              <input
                {...register("headline")}
                placeholder="e.g. Head of Raw Material Procurement"
                className={inputClass}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Country</label>
                <input
                  {...register("country")}
                  placeholder="e.g. Vietnam, United States"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Location / City
                </label>
                <input
                  {...register("location")}
                  placeholder="e.g. Ho Chi Minh City"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Direct Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="name@company.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Phone</label>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="+84 28 3824 9911"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Notes</label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Any procurement notes, curcumin specs, or discussion context…"
                className={inputClass}
              />
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#084e96] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding…</span>
                </>
              ) : (
                <span>Add LinkedIn Lead</span>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

