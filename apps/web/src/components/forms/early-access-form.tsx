"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { earlyAccessSchema } from "@nexahaus/validation";
import { submitPublic } from "@/lib/submit-public";
import { track } from "@/lib/analytics";
import {
  COUNTRY_OPTIONS,
  PROPERTY_COUNT_OPTIONS,
  SERVICE_OPTIONS,
  parsePropertyCount,
} from "@/lib/form-options";
import {
  TextInput,
  SelectInput,
  TextArea,
  ConsentCheckbox,
  Honeypot,
  FormError,
} from "./fields";
import { MultiChoice } from "./choice";

const CONSENT_WORDING =
  "I agree that NexaHaus may contact me about Early Access and its services. I can opt out at any time.";

type Campaign = "EARLY_ACCESS" | "FOUNDING_100" | "OWNER_CLUB";

const PROGRAMME_LABEL: Record<Campaign, string> = {
  EARLY_ACCESS: "Early Access",
  FOUNDING_100: "Founding 100",
  OWNER_CLUB: "Property Owners Club",
};

const QUERY_MAP: Record<string, Campaign> = {
  "founding-100": "FOUNDING_100",
  founding100: "FOUNDING_100",
  "owners-club": "OWNER_CLUB",
  "owner-club": "OWNER_CLUB",
  "early-access": "EARLY_ACCESS",
};

function EarlyAccessFormInner({ lockCampaign }: { lockCampaign?: Campaign }) {
  const params = useSearchParams();
  const fromQuery = QUERY_MAP[params.get("programme") ?? ""] ?? undefined;
  const initialCampaign: Campaign = lockCampaign ?? fromQuery ?? "EARLY_ACCESS";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    propertyCount: "",
    location: "",
    interest: "",
  });
  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);
  const [services, setServices] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const startedRef = useRef(false);

  const set =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      if (!startedRef.current) {
        startedRef.current = true;
        track("form_started", { form: "early_access", programme: campaign });
      }
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setError(null);
    };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    if (!consent) {
      setError("Please agree to be contacted.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      propertyCount: parsePropertyCount(form.propertyCount),
      location: form.location.trim() || undefined,
      livesInGhana: form.country ? form.country === "Ghana" : undefined,
      interest: form.interest.trim() || undefined,
      serviceInterest: services.length ? services : undefined,
      campaign,
      consent: { marketing: true as const, wording: CONSENT_WORDING },
    };

    const parsed = earlyAccessSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Please check your name, email and phone number.");
      return;
    }

    setSubmitting(true);
    const res = await submitPublic<{ message: string }>(
      "/early-access",
      parsed.data,
      { honeypot },
    );
    setSubmitting(false);
    if (res.ok) {
      track("form_completed", { form: "early_access" });
      track("early_access_joined", { programme: campaign });
      setDone(
        res.data?.message ??
          "You're on the list. We'll be in touch before launch.",
      );
    } else {
      setError(res.error ?? "Something went wrong. Please try again.");
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-positive/30 bg-positive/5 p-8 text-center">
        <p className="text-base font-semibold text-navy-900">
          You&rsquo;re on the {PROGRAMME_LABEL[campaign]} list
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{done}</p>
        <a
          href="/"
          className="mt-5 inline-flex h-11 items-center rounded-lg border border-line px-5 text-sm font-semibold text-navy-900 hover:bg-surface-sunken"
        >
          Back to home
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-4">
      <Honeypot value={honeypot} onChange={setHoneypot} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Full name"
          required
          value={form.name}
          onChange={set("name")}
          autoComplete="name"
        />
        <TextInput
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
        />
        <TextInput
          label="Phone"
          type="tel"
          required
          placeholder="+233…"
          value={form.phone}
          onChange={set("phone")}
          hint="Include the country code."
        />
        <SelectInput
          label="Country"
          options={COUNTRY_OPTIONS}
          value={form.country}
          onChange={set("country")}
        />
        <SelectInput
          label="How many properties?"
          options={PROPERTY_COUNT_OPTIONS}
          value={form.propertyCount}
          onChange={set("propertyCount")}
        />
        <TextInput
          label="Location"
          placeholder="City / area"
          value={form.location}
          onChange={set("location")}
        />
      </div>

      {!lockCampaign ? (
        <SelectInput
          label="Programme"
          placeholder="Choose a programme"
          options={[
            { value: "EARLY_ACCESS", label: "Early Access" },
            { value: "FOUNDING_100", label: "Founding 100" },
            { value: "OWNER_CLUB", label: "Property Owners Club" },
          ]}
          value={campaign}
          onChange={(e) => setCampaign(e.target.value as Campaign)}
        />
      ) : (
        <input type="hidden" name="campaign" value={campaign} />
      )}

      <MultiChoice
        label="Which services are you most interested in?"
        options={SERVICE_OPTIONS}
        values={services}
        onChange={setServices}
      />

      <TextArea
        label="What would you most want help with?"
        rows={3}
        value={form.interest}
        onChange={set("interest")}
      />

      <ConsentCheckbox
        checked={consent}
        onChange={(v) => {
          setConsent(v);
          setError(null);
        }}
        wording={CONSENT_WORDING}
      />

      <FormError message={error} />

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-6 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
      >
        {submitting
          ? "Submitting…"
          : lockCampaign === "FOUNDING_100"
            ? "Join the Founding 100"
            : "Join Early Access"}
      </button>
    </form>
  );
}

export function EarlyAccessForm({ lockCampaign }: { lockCampaign?: Campaign }) {
  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-xl bg-surface-sunken" />
      }
    >
      <EarlyAccessFormInner lockCampaign={lockCampaign} />
    </Suspense>
  );
}
