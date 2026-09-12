"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const controlCls =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-sm placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 disabled:opacity-60 aria-[invalid=true]:border-critical";

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("block", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-navy-900"
      >
        {label}
        {required ? <span className="text-critical"> *</span> : null}
        {!required ? (
          <span className="ml-1 text-xs font-normal text-ink-subtle">
            (optional)
          </span>
        ) : null}
      </label>
      {hint ? <p className="mb-1 text-xs text-ink-subtle">{hint}</p> : null}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-critical" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  wrapClassName?: string;
};

export function TextInput({
  label,
  error,
  hint,
  wrapClassName,
  id,
  required,
  ...props
}: InputProps) {
  const gen = useId();
  const fieldId = id ?? gen;
  return (
    <Field
      label={label}
      htmlFor={fieldId}
      required={required}
      error={error}
      hint={hint}
      className={wrapClassName}
    >
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-err` : undefined}
        className={cn(controlCls, "h-10")}
        {...props}
      />
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: readonly (string | { value: string; label: string })[];
  wrapClassName?: string;
};

export function SelectInput({
  label,
  error,
  hint,
  placeholder = "Select…",
  options,
  wrapClassName,
  id,
  required,
  ...props
}: SelectProps) {
  const gen = useId();
  const fieldId = id ?? gen;
  return (
    <Field
      label={label}
      htmlFor={fieldId}
      required={required}
      error={error}
      hint={hint}
      className={wrapClassName}
    >
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(controlCls, "h-10")}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const value = typeof o === "string" ? o : o.value;
          const text = typeof o === "string" ? o : o.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
  wrapClassName?: string;
};

export function TextArea({
  label,
  error,
  hint,
  wrapClassName,
  id,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
  const gen = useId();
  const fieldId = id ?? gen;
  return (
    <Field
      label={label}
      htmlFor={fieldId}
      required={required}
      error={error}
      hint={hint}
      className={wrapClassName}
    >
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(controlCls, "py-2")}
        {...props}
      />
    </Field>
  );
}

export function ConsentCheckbox({
  checked,
  onChange,
  wording,
  error,
  id = "consent",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  wording: string;
  error?: string;
  id?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-start gap-2 text-sm text-ink-muted"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          className="mt-0.5 h-4 w-4 rounded border-line text-navy-900 focus-visible:ring-2 focus-visible:ring-navy-500"
        />
        <span>{wording}</span>
      </label>
      {error ? (
        <p className="mt-1 text-xs text-critical" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Off-screen honeypot. If a bot fills it, the submit handler drops the request. */
export function Honeypot({
  value,
  onChange,
  name = "company_website",
}: {
  value: string;
  onChange: (v: string) => void;
  name?: string;
}) {
  return (
    <div
      aria-hidden
      className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
    >
      <label htmlFor={name}>Leave this field empty</label>
      <input
        id={name}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-sm text-critical"
      role="alert"
    >
      {message}
    </p>
  );
}
