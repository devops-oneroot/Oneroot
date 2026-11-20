import type { WheelEvent } from "react";
import { z } from "zod";

/** Coerces empty / NaN number inputs from react-hook-form valueAsNumber. */
export const optionalNumber = z.preprocess(
  (val) => {
    if (typeof val === "number" && Number.isNaN(val)) return undefined;
    return val;
  },
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      const n = typeof val === "number" ? val : Number(val);
      return Number.isNaN(n) ? undefined : n;
    })
);

const preprocessNumberInput = (val: unknown) => {
  if (typeof val === "number" && Number.isNaN(val)) return undefined;
  return val;
};

/** Required number input (e.g. curcumin %); allows zero. */
export function requiredNonNegativeNumber(label: string) {
  return z.preprocess(
    preprocessNumberInput,
    z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== undefined && val !== null, {
        message: `${label} is required`,
      })
      .transform((val) => {
        const n = typeof val === "number" ? val : Number(val);
        return n;
      })
      .pipe(
        z
          .number({ error: `${label} is required` })
          .min(0, `${label} must be 0 or greater`)
      )
  );
}

/** Required number input that must be greater than zero (e.g. price). */
export function requiredPositiveNumber(label: string) {
  return z.preprocess(
    preprocessNumberInput,
    z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== undefined && val !== null, {
        message: `${label} is required`,
      })
      .transform((val) => {
        const n = typeof val === "number" ? val : Number(val);
        return n;
      })
      .pipe(
        z
          .number({ error: `${label} is required` })
          .gt(0, `${label} must be greater than 0`)
      )
  );
}

export const selectClass =
  "w-full cursor-pointer appearance-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 [color-scheme:light]";

export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

/** Spread on `<input type="number" />` so scroll wheel does not change the value. */
export const numberInputWheelProps = {
  onWheel: (e: WheelEvent<HTMLInputElement>) => e.currentTarget.blur(),
} as const;
