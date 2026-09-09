"use client";

import { useState } from "react";
import Link from "next/link";

const CONSENT_WORDING =
  "I agree that NexaHaus may contact me about Early Access and its services. I can opt out at any time.";
const inputCls =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500";

export default function EarlyAccessPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    propertyCount: "",
    location: "",
    interest: "",
    campaign: "EARLY_ACCESS",
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Please agree to be contacted.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/public/early-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          propertyCount: form.propertyCount ? Number(form.propertyCount) : undefined,
          location: form.location.trim() || undefined,
          interest: form.interest.trim() || undefined,
          campaign: form.campaign,
          consent: { marketing: true, wording: CONSENT_WORDING },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message ?? "Something went wrong.");
      }
      setDone(json.data.message as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">You&rsquo;re on the list</h1>
        <p className="mt-3 text-ink-muted">{done}</p>
        <Link href="/welcome" className="mt-6 inline-flex rounded-lg border border-line px-5 py-3 text-sm font-semibold text-navy-900 hover:bg-surface-sunken">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <h1 className="text-3xl font-semibold text-navy-900">NexaHaus Early Access</h1>
      <p className="mt-2 text-ink-muted">
        Be among the first owners onboarded when NexaHaus opens in Accra. Founding
        clients get priority onboarding and shape the platform.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </Field>
          <Field label="Phone (+233…)">
            <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </Field>
          <Field label="How many properties?">
            <input className={inputCls} inputMode="numeric" value={form.propertyCount} onChange={(e) => setForm((f) => ({ ...f, propertyCount: e.target.value.replace(/\D/g, "") }))} />
          </Field>
          <Field label="Location">
            <input className={inputCls} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="City / area" />
          </Field>
          <Field label="Programme">
            <select className={inputCls} value={form.campaign} onChange={(e) => setForm((f) => ({ ...f, campaign: e.target.value }))}>
              <option value="EARLY_ACCESS">Early Access</option>
              <option value="FOUNDING_100">Founding 100</option>
              <option value="OWNER_CLUB">Property Owner Club</option>
            </select>
          </Field>
        </div>
        <Field label="What would you most want help with?">
          <textarea
            rows={3}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
            value={form.interest}
            onChange={(e) => setForm((f) => ({ ...f, interest: e.target.value }))}
          />
        </Field>

        <label className="flex items-start gap-2 border-t border-line pt-4 text-sm text-ink-muted">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          {CONSENT_WORDING}
        </label>

        {error ? <p className="text-sm text-critical">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Join Early Access"}
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
