"use client";

import { useState } from "react";
import Link from "next/link";

type Answers = {
  occupied: boolean | null;
  managedProfessionally: boolean | null;
  tenantsPayOnTime: "" | "ALWAYS" | "USUALLY" | "SOMETIMES" | "RARELY";
  inspectionFrequency: "" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "NEVER";
  receivesFinancialReports: boolean | null;
  documentsInOrder: boolean | null;
  lastMaintenanceRecent: boolean | null;
};

const CONSENT_WORDING =
  "I agree that NexaHaus may contact me about my property assessment and its services. I can opt out at any time.";

const inputCls =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500";

export default function HealthCheckPage() {
  const [contact, setContact] = useState({ contactName: "", email: "", phone: "", location: "" });
  const [livesInGhana, setLivesInGhana] = useState<boolean | null>(null);
  const [propertyCount, setPropertyCount] = useState("1");
  const [answers, setAnswers] = useState<Answers>({
    occupied: null,
    managedProfessionally: null,
    tenantsPayOnTime: "",
    inspectionFrequency: "",
    receivesFinancialReports: null,
    documentsInOrder: null,
    lastMaintenanceRecent: null,
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ preliminaryScore: number; band: string; headline: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (
      livesInGhana === null ||
      Object.values(answers).some((v) => v === null || v === "") ||
      !consent
    ) {
      setError("Please answer every question and agree to be contacted.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/public/property-health-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contactName: contact.contactName.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
          livesInGhana,
          location: contact.location.trim() || undefined,
          propertyCount: Number(propertyCount) || 1,
          answers,
          consent: { marketing: true, wording: CONSENT_WORDING },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "Something went wrong.");
      }
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const tone =
      result.band === "HEALTHY" ? "text-positive" : result.band === "NEEDS_ATTENTION" ? "text-warning" : "text-critical";
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-ink-subtle">
          Preliminary Property Health Score
        </p>
        <p className={`mt-3 text-6xl font-semibold tabular-nums ${tone}`}>{result.preliminaryScore}<span className="text-2xl text-ink-subtle">/100</span></p>
        <p className="mt-4 text-lg text-navy-900">{result.headline}</p>
        <p className="mx-auto mt-4 max-w-lg text-sm text-ink-subtle">
          This is a preliminary digital assessment based on your own answers. It is
          not a professional property assessment or valuation. For a full picture,
          request a professional property assessment from NexaHaus.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/early-access" className="rounded-lg bg-navy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800">
            Request a professional assessment
          </Link>
          <Link href="/welcome" className="rounded-lg border border-line px-5 py-3 text-sm font-semibold text-navy-900 hover:bg-surface-sunken">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-3xl font-semibold text-navy-900">Property Health Check</h1>
      <p className="mt-2 text-ink-muted">
        Two minutes, seven questions. You&rsquo;ll get a preliminary health score
        straight away.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <Field label="Your name">
            <input className={inputCls} value={contact.contactName} onChange={(e) => setContact((c) => ({ ...c, contactName: e.target.value }))} required />
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} required />
          </Field>
          <Field label="Phone (+233…)">
            <input className={inputCls} value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} required />
          </Field>
          <Field label="Where is the property?">
            <input className={inputCls} value={contact.location} onChange={(e) => setContact((c) => ({ ...c, location: e.target.value }))} placeholder="e.g. East Legon, Accra" />
          </Field>
          <Field label="How many properties?">
            <input className={inputCls} inputMode="numeric" value={propertyCount} onChange={(e) => setPropertyCount(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <YesNo label="Do you live in Ghana?" value={livesInGhana} onChange={setLivesInGhana} />
        </fieldset>

        <div className="space-y-4 border-t border-line pt-6">
          <YesNo label="Is the property currently occupied?" value={answers.occupied} onChange={(v) => setAnswers((a) => ({ ...a, occupied: v }))} />
          <YesNo label="Is it managed by a professional company?" value={answers.managedProfessionally} onChange={(v) => setAnswers((a) => ({ ...a, managedProfessionally: v }))} />
          <Choice
            label="Do tenants pay on time?"
            value={answers.tenantsPayOnTime}
            options={[["ALWAYS", "Always"], ["USUALLY", "Usually"], ["SOMETIMES", "Sometimes"], ["RARELY", "Rarely"]]}
            onChange={(v) => setAnswers((a) => ({ ...a, tenantsPayOnTime: v as Answers["tenantsPayOnTime"] }))}
          />
          <Choice
            label="How often is the property inspected?"
            value={answers.inspectionFrequency}
            options={[["MONTHLY", "Monthly"], ["QUARTERLY", "Quarterly"], ["YEARLY", "Yearly"], ["NEVER", "Never"]]}
            onChange={(v) => setAnswers((a) => ({ ...a, inspectionFrequency: v as Answers["inspectionFrequency"] }))}
          />
          <YesNo label="Do you receive regular financial reports?" value={answers.receivesFinancialReports} onChange={(v) => setAnswers((a) => ({ ...a, receivesFinancialReports: v }))} />
          <YesNo label="Are the property documents in order (title, tenancy, insurance)?" value={answers.documentsInOrder} onChange={(v) => setAnswers((a) => ({ ...a, documentsInOrder: v }))} />
          <YesNo label="Has maintenance been done in the last 6 months (if needed)?" value={answers.lastMaintenanceRecent} onChange={(v) => setAnswers((a) => ({ ...a, lastMaintenanceRecent: v }))} />
        </div>

        <label className="flex items-start gap-2 border-t border-line pt-5 text-sm text-ink-muted">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          {CONSENT_WORDING}
        </label>

        {error ? <p className="text-sm text-critical">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {busy ? "Scoring…" : "Get my health score"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-navy-900">{label}</span>
      {children}
    </label>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="text-sm">
      <p className="mb-1.5 font-medium text-navy-900">{label}</p>
      <div className="flex gap-2">
        {[["Yes", true], ["No", false]].map(([t, v]) => (
          <button
            key={t as string}
            type="button"
            onClick={() => onChange(v as boolean)}
            className={
              "rounded-lg border px-4 py-1.5 text-sm " +
              (value === v ? "border-navy-900 bg-navy-900 text-white" : "border-line text-ink-muted hover:border-navy-300")
            }
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="text-sm">
      <p className="mb-1.5 font-medium text-navy-900">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, t]) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={
              "rounded-lg border px-3 py-1.5 text-sm " +
              (value === v ? "border-navy-900 bg-navy-900 text-white" : "border-line text-ink-muted hover:border-navy-300")
            }
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
