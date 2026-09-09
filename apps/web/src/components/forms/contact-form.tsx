"use client";

import { useRef, useState } from "react";
import { contactEnquirySchema } from "@nexahaus/validation";
import { submitPublic } from "@/lib/submit-public";
import { track } from "@/lib/analytics";
import {
  COUNTRY_OPTIONS,
  PREFERRED_CONTACT,
  PROPERTY_COUNT_OPTIONS,
  PROPERTY_TYPES,
  SERVICE_OPTIONS,
  parsePropertyCount,
} from "@/lib/form-options";
import { TextInput, SelectInput, TextArea, ConsentCheckbox, Honeypot, FormError } from "./fields";

const CONSENT_WORDING =
  "I agree that NexaHaus may contact me about my enquiry and its services. I can opt out at any time.";

type Values = {
  name: string;
  email: string;
  phone: string;
  country: string;
  propertyLocation: string;
  propertyType: string;
  propertyCount: string;
  serviceNeeded: string;
  message: string;
  preferredContact: string;
};

const EMPTY: Values = {
  name: "",
  email: "",
  phone: "",
  country: "",
  propertyLocation: "",
  propertyType: "",
  propertyCount: "",
  serviceNeeded: "",
  message: "",
  preferredContact: "EMAIL",
};

export function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values | "consent", string>>>({});
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const startedRef = useRef(false);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_started", { form: "contact" });
    }
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (honeypot) return; // bot

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      country: values.country || undefined,
      propertyLocation: values.propertyLocation.trim() || undefined,
      propertyType: values.propertyType || undefined,
      propertyCount: parsePropertyCount(values.propertyCount),
      serviceNeeded: values.serviceNeeded || undefined,
      message: values.message.trim(),
      preferredContact: values.preferredContact as "EMAIL" | "PHONE" | "WHATSAPP",
      livesInGhana: values.country ? values.country === "Ghana" : undefined,
      consent: { marketing: true as const, wording: CONSENT_WORDING },
    };

    const parsed = contactEnquirySchema.safeParse(payload);
    const nextErrors: typeof errors = {};
    if (!consent) nextErrors.consent = "Please agree to be contacted.";
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Values;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
    }
    if (!parsed.success || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setStatus("submitting");
    const result = await submitPublic<{ message: string }>("/contact", parsed.data);
    if (result.ok) {
      track("form_completed", { form: "contact" });
      track("contact_submitted", { service: payload.serviceNeeded ?? "unspecified" });
      setSuccessMsg(result.data?.message ?? "Thank you. Your enquiry has been received.");
      setStatus("done");
    } else {
      setStatus("idle");
      setFormError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-positive/30 bg-positive/5 p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-positive/10 text-positive">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-3 text-base font-semibold text-navy-900">Enquiry received</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{successMsg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4">
      <Honeypot value={honeypot} onChange={setHoneypot} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Full name" autoComplete="name" required value={values.name} onChange={set("name")} error={errors.name} />
        <TextInput label="Email" type="email" autoComplete="email" required value={values.email} onChange={set("email")} error={errors.email} />
        <TextInput label="Phone" type="tel" inputMode="tel" placeholder="+233…" required value={values.phone} onChange={set("phone")} error={errors.phone} hint="Include the country code." />
        <SelectInput label="Country" options={COUNTRY_OPTIONS} value={values.country} onChange={set("country")} error={errors.country} />
        <TextInput label="Property location" placeholder="e.g. East Legon, Accra" value={values.propertyLocation} onChange={set("propertyLocation")} error={errors.propertyLocation} />
        <SelectInput label="Property type" options={PROPERTY_TYPES} value={values.propertyType} onChange={set("propertyType")} error={errors.propertyType} />
        <SelectInput label="Number of properties" options={PROPERTY_COUNT_OPTIONS} value={values.propertyCount} onChange={set("propertyCount")} error={errors.propertyCount} />
        <SelectInput label="Service needed" options={SERVICE_OPTIONS} value={values.serviceNeeded} onChange={set("serviceNeeded")} error={errors.serviceNeeded} />
      </div>

      <TextArea
        label="Message"
        required
        rows={5}
        placeholder="Tell us about your property and what you want solved."
        value={values.message}
        onChange={set("message")}
        error={errors.message}
      />

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-navy-900">Preferred contact method</legend>
        <div className="flex flex-wrap gap-2">
          {PREFERRED_CONTACT.map((opt) => (
            <label
              key={opt.value}
              className={
                "cursor-pointer rounded-lg border px-3 py-1.5 text-sm " +
                (values.preferredContact === opt.value
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-line text-ink-muted hover:border-navy-300")
              }
            >
              <input
                type="radio"
                name="preferredContact"
                value={opt.value}
                checked={values.preferredContact === opt.value}
                onChange={set("preferredContact")}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <ConsentCheckbox checked={consent} onChange={(v) => { setConsent(v); setErrors((p) => ({ ...p, consent: undefined })); }} wording={CONSENT_WORDING} error={errors.consent} />

      <FormError message={formError} />

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-6 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
      >
        {status === "submitting" ? "Sending…" : "Submit Enquiry"}
      </button>
    </form>
  );
}
