"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const pill =
  "cursor-pointer rounded-lg border px-3.5 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-navy-500";
const pillOn = "border-navy-900 bg-navy-900 text-white";
const pillOff = "border-line text-ink-muted hover:border-navy-300";

/** Radiogroup rendered as pill buttons. */
export function ChoiceGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  columns,
}: {
  label: string;
  value: T | "";
  onChange: (v: T) => void;
  options: readonly (T | { value: T; label: string })[];
  error?: string;
  hint?: string;
  columns?: 2 | 3;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="text-sm font-medium text-navy-900">{label}</legend>
      {hint ? <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p> : null}
      <div
        className={cn(
          "mt-2 flex flex-wrap gap-2",
          columns === 2 && "sm:grid sm:grid-cols-2",
          columns === 3 && "sm:grid sm:grid-cols-3",
        )}
      >
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const text = typeof o === "string" ? o : o.label;
          const on = value === v;
          return (
            <label key={v} className={cn(pill, on ? pillOn : pillOff)}>
              <input
                type="radio"
                name={name}
                value={v}
                checked={on}
                onChange={() => onChange(v)}
                className="sr-only"
              />
              {text}
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-critical" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Yes / No convenience wrapper over ChoiceGroup semantics (boolean value). */
export function YesNo({
  label,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  error?: string;
  hint?: string;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="text-sm font-medium text-navy-900">{label}</legend>
      {hint ? <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p> : null}
      <div className="mt-2 flex gap-2">
        {[
          ["Yes", true],
          ["No", false],
        ].map(([t, v]) => {
          const on = value === v;
          return (
            <label
              key={t as string}
              className={cn(
                pill,
                "min-w-[4.5rem] text-center",
                on ? pillOn : pillOff,
              )}
            >
              <input
                type="radio"
                name={name}
                checked={on}
                onChange={() => onChange(v as boolean)}
                className="sr-only"
              />
              {t as string}
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-critical" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Multi-select rendered as toggle pills. */
export function MultiChoice<T extends string>({
  label,
  values,
  onChange,
  options,
  error,
  hint,
  max,
}: {
  label: string;
  values: T[];
  onChange: (v: T[]) => void;
  options: readonly T[];
  error?: string;
  hint?: string;
  max?: number;
}) {
  const toggle = (v: T) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else if (!max || values.length < max) onChange([...values, v]);
  };
  return (
    <fieldset>
      <legend className="text-sm font-medium text-navy-900">{label}</legend>
      {hint ? <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o)}
              className={cn(pill, on ? pillOn : pillOff)}
            >
              {o}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-critical" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
