"use client";

import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { PRODUCT_OPTIONS, type ProductName } from "@/lib/types";

interface ProductMultiSelectProps {
  control: Control<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
}

export function ProductMultiSelect({ control, errors }: ProductMultiSelectProps) {
  return (
    <div>
      <Controller
        name="productNames"
        control={control}
        render={({ field }) => {
          const selected = new Set<ProductName>(field.value ?? []);
          const toggle = (id: ProductName) => {
            const next = new Set(selected);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            field.onChange(Array.from(next));
          };

          return (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PRODUCT_OPTIONS.map((product) => {
                const checked = selected.has(product.id);
                return (
                  <label
                    key={product.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? "border-violet-500 bg-violet-50 text-violet-900"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(product.id)}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    {product.label}
                  </label>
                );
              })}
            </div>
          );
        }}
      />
      {errors.productNames?.message && (
        <p className="mt-1 text-xs text-red-600">{errors.productNames.message}</p>
      )}
    </div>
  );
}
