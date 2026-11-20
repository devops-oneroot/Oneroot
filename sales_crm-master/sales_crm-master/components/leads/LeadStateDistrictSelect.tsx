"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLocationDistricts, fetchLocationStates } from "@/lib/api";
import { inputClass } from "@/lib/leadForm";

interface LeadStateDistrictSelectProps {
  stateLabel: string;
  districtLabel: string;
  stateValue: string;
  districtValue: string;
  onStateChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  stateError?: string;
  districtError?: string;
}

function SelectField({
  label,
  value,
  options,
  loading,
  disabled,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  value: string;
  options: string[];
  loading?: boolean;
  disabled?: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">
          {loading ? "Loading…" : placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

export function LeadStateDistrictSelect({
  stateLabel,
  districtLabel,
  stateValue,
  districtValue,
  onStateChange,
  onDistrictChange,
  stateError,
  districtError,
}: LeadStateDistrictSelectProps) {
  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ["location-states"],
    queryFn: fetchLocationStates,
  });

  const { data: districts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ["location-districts", stateValue],
    queryFn: () => fetchLocationDistricts(stateValue),
    enabled: Boolean(stateValue),
  });

  return (
    <>
      <SelectField
        label={stateLabel}
        value={stateValue}
        options={states}
        loading={statesLoading}
        placeholder="Select state"
        onChange={(value) => {
          onStateChange(value);
          onDistrictChange("");
        }}
        error={stateError}
      />
      <SelectField
        label={districtLabel}
        value={districtValue}
        options={districts}
        loading={districtsLoading}
        disabled={!stateValue}
        placeholder={stateValue ? "Select district" : "Select state first"}
        onChange={onDistrictChange}
        error={districtError}
      />
    </>
  );
}
