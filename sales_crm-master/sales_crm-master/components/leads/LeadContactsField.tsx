"use client";

import { Plus, X } from "lucide-react";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { inputClass } from "@/lib/leadForm";
import { emptyContactEntry } from "@/lib/leadContacts";
import { FormField } from "./FormField";
import { MultiStringField } from "./MultiStringField";
import { PhoneDuplicateNotice } from "./PhoneDuplicateNotice";
import { useLeadFormMode } from "./LeadFormModeContext";

interface LeadContactsFieldProps {
  control: Control<LeadFormInput>;
  register: UseFormRegister<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
}

export function LeadContactsField({
  control,
  register,
  errors,
}: LeadContactsFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });
  const { lockedContacts, lockedWhatsappNumbers } = useLeadFormMode();
  const lockedPhones = lockedContacts ? [...lockedContacts.phones] : [];
  /** A contact card that existed when the form opened, for a non-admin. */
  const isSavedCard = (index: number) =>
    !!lockedContacts && index < lockedContacts.savedCount;

  return (
    <div className="space-y-3 sm:col-span-2">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Contact {index + 1}
            </p>
            {fields.length > 1 && !isSavedCard(index) && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Contact person"
              error={errors.contacts?.[index]?.name?.message}
            >
              <input
                {...register(`contacts.${index}.name`)}
                className={inputClass}
                placeholder="Contact name"
              />
            </FormField>
            <MultiStringField
              control={control}
              name={`contacts.${index}.phones`}
              label="Phone"
              placeholder="Phone number"
              addLabel="Add another number"
              lockedValues={lockedPhones}
              errorMessage={
                errors.contacts?.[index]?.phone?.message ??
                errors.contacts?.[index]?.phones?.message
              }
            />
            <FormField
              label="Email"
              error={errors.contacts?.[index]?.email?.message}
            >
              <EmailInput
                index={index}
                register={register}
                locked={
                  !!lockedContacts &&
                  isSavedCard(index) &&
                  lockedContacts.emails.has(
                    String(field.email ?? "").trim().toLowerCase()
                  ) &&
                  String(field.email ?? "").trim() !== ""
                }
              />
            </FormField>
            <FormField
              label="Designation"
              error={errors.contacts?.[index]?.designation?.message}
            >
              <input
                {...register(`contacts.${index}.designation`)}
                className={inputClass}
                placeholder="Designation"
              />
            </FormField>
            <FormField
              label="LinkedIn"
              error={errors.contacts?.[index]?.linkedIn?.message}
              className="sm:col-span-2"
            >
              <input
                type="url"
                {...register(`contacts.${index}.linkedIn`)}
                className={inputClass}
                placeholder="https://linkedin.com/in/..."
              />
            </FormField>
            <ContactOtherDetails control={control} register={register} index={index} />
          </div>
        </div>
      ))}

      {lockedContacts && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Saved phone numbers and emails can only be changed by an admin. You
          can add another number, or add a new contact.
        </p>
      )}

      <PhoneDuplicateNotice control={control} />

      <button
        type="button"
        onClick={() => append(emptyContactEntry())}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700"
      >
        <Plus className="h-4 w-4" />
        Add another contact
      </button>

      <MultiStringField
        control={control}
        name="whatsappNumbers"
        label="WhatsApp/zolo number"
        addLabel="Add another number"
        lockedValues={lockedWhatsappNumbers ? [...lockedWhatsappNumbers] : []}
        errorMessage={errors.whatsappNumbers?.message as string | undefined}
      />
      {lockedWhatsappNumbers && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Saved WhatsApp numbers can only be changed by an admin. You can add
          another number.
        </p>
      )}
    </div>
  );
}

function EmailInput({
  index,
  register,
  locked,
}: {
  index: number;
  register: UseFormRegister<LeadFormInput>;
  locked: boolean;
}) {
  return (
    <input
      type="email"
      {...register(`contacts.${index}.email`)}
      readOnly={locked}
      title={locked ? "Saved — only an admin can change this" : undefined}
      className={`${inputClass}${locked ? " cursor-not-allowed bg-slate-100 text-slate-600" : ""}`}
      placeholder="email@example.com"
    />
  );
}

/**
 * Free-text extras for one contact — anything that doesn't fit name, phone,
 * email, designation or LinkedIn. Starts with no rows; each click on the
 * button adds one more line, removable on its own.
 */
function ContactOtherDetails({
  control,
  index,
}: {
  control: Control<LeadFormInput>;
  register: UseFormRegister<LeadFormInput>;
  index: number;
}) {
  return (
    <div className="sm:col-span-2">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Add other detail
      </span>
      <Controller
        name={`contacts.${index}.otherDetails`}
        control={control}
        render={({ field }) => {
          const items = Array.isArray(field.value) ? field.value : [];

          const update = (next: string[]) => field.onChange(next);

          return (
            <div>
              {items.length > 0 && (
                <div className="mb-2 space-y-2">
                  {items.map((value, detailIndex) => (
                    <div key={detailIndex} className="flex gap-2">
                      <input
                        value={value}
                        onChange={(e) => {
                          const next = [...items];
                          next[detailIndex] = e.target.value;
                          update(next);
                        }}
                        className={`${inputClass} min-w-0 flex-1`}
                        placeholder=""
                      />
                      <button
                        type="button"
                        onClick={() =>
                          update(items.filter((_, i) => i !== detailIndex))
                        }
                        className="shrink-0 rounded-lg border border-slate-200 px-2 text-slate-500 hover:bg-slate-50 hover:text-red-600"
                        aria-label="Remove detail"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => update([...items, ""])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add other detail
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
