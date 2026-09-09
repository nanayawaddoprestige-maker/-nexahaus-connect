"use client";

import { useMemo, useRef, useState } from "react";
import { propertyOwnerSurveySchema } from "@nexahaus/validation";
import { submitPublic } from "@/lib/submit-public";
import { track } from "@/lib/analytics";
import { COUNTRY_OPTIONS, PROPERTY_COUNT_OPTIONS, SERVICE_OPTIONS, parsePropertyCount } from "@/lib/form-options";
import { TextInput, SelectInput, TextArea, ConsentCheckbox, Honeypot, FormError } from "./fields";
import { ChoiceGroup, MultiChoice } from "./choice";
import { useSteps, StepProgress, StepPanel, StepNav } from "./steps";

const CONSENT_WORDING =
  "I agree that NexaHaus may contact me about this research and its services. I can opt out at any time.";

const STEPS = [
  { id: "you", label: "About You" },
  { id: "properties", label: "Your Properties" },
  { id: "challenges", label: "Your Challenges" },
  { id: "needs", label: "What You Need" },
  { id: "contact", label: "Contact" },
];

const SEGMENTS = [
  "Individual owner",
  "Landlord with tenants",
  "Investor",
  "Developer",
  "Commercial owner",
  "Diaspora owner",
] as const;

const CHALLENGES = [
  "Rent collection",
  "Unreliable caretaker / manager",
  "Maintenance",
  "Vacancy",
  "No inspections",
  "No financial reporting",
  "Tenant issues",
  "Managing from abroad",
  "Property documentation",
  "Not knowing performance",
] as const;

const REPORTING = ["Monthly", "Quarterly", "On request", "I don't need reports"] as const;
const TECH = ["Very important", "Somewhat important", "Not important"] as const;
const WILLING = ["Yes", "Maybe", "No"] as const;

type State = {
  name: string;
  email: string;
  phone: string;
  country: string;
  segment: string;
  propertyCount: string;
  location: string;
  currentManagement: string;
  challenges: string[];
  biggestChallenge: string;
  services: string[];
  reporting: string;
  technology: string;
  willingToUsePro: string;
};

const INIT: State = {
  name: "",
  email: "",
  phone: "",
  country: "",
  segment: "",
  propertyCount: "",
  location: "",
  currentManagement: "",
  challenges: [],
  biggestChallenge: "",
  services: [],
  reporting: "",
  technology: "",
  willingToUsePro: "",
};

const MGMT_OPTIONS = ["Self-managed", "Family member", "Caretaker", "Agent", "Management company"] as const;

export function PropertyOwnerSurveyForm() {
  const [s, setS] = useState<State>(INIT);
  const [honeypot, setHoneypot] = useState("");
  const [consent, setConsent] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const startedRef = useRef(false);

  const steps = useSteps(STEPS);
  const set = <K extends keyof State>(k: K, v: State[K]) => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_started", { form: "property_owner_survey" });
    }
    setS((p) => ({ ...p, [k]: v }));
    setStepError(null);
  };

  const stepValid = useMemo(() => {
    switch (steps.current.id) {
      case "you":
        return s.name.trim().length >= 2 && /.+@.+\..+/.test(s.email) && !!s.segment;
      case "properties":
        return !!s.propertyCount && !!s.currentManagement;
      case "challenges":
        return s.challenges.length > 0;
      case "needs":
        return s.services.length > 0 && !!s.reporting && !!s.willingToUsePro;
      case "contact":
        return s.phone.trim().length >= 7 && consent;
      default:
        return true;
    }
  }, [steps, s, consent]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    if (!stepValid) {
      setStepError(
        steps.current.id === "contact"
          ? "Please add a phone number and agree to be contacted."
          : "Please complete this step to continue.",
      );
      return;
    }
    if (!steps.isLast) {
      steps.next();
      return;
    }

    const answers: Record<string, string | number | boolean | string[]> = {
      ownerSegment: s.segment,
      currentManagement: s.currentManagement,
      propertyLocationSummary: s.location.trim(),
      challenges: s.challenges,
      biggestChallenge: s.biggestChallenge.trim(),
      servicesWanted: s.services,
      reportingExpectation: s.reporting,
      technologyImportance: s.technology,
      willingToUseProfessional: s.willingToUsePro,
    };

    const payload = {
      name: s.name.trim(),
      email: s.email.trim(),
      phone: s.phone.trim(),
      country: s.country || undefined,
      livesInGhana: s.country ? s.country === "Ghana" : undefined,
      propertyCount: parsePropertyCount(s.propertyCount),
      location: s.location.trim() || undefined,
      biggestChallenge: s.biggestChallenge.trim() || (s.challenges[0] ?? undefined),
      serviceInterest: s.services.length ? s.services : undefined,
      answers,
      consent: { marketing: true as const, wording: CONSENT_WORDING },
    };

    const parsed = propertyOwnerSurveySchema.safeParse(payload);
    if (!parsed.success) {
      setStepError("Something in your answers looks off. Please review and try again.");
      return;
    }

    setSubmitting(true);
    const res = await submitPublic<{ message: string }>("/property-owner-survey", parsed.data);
    setSubmitting(false);
    if (res.ok) {
      track("form_completed", { form: "property_owner_survey" });
      track("survey_completed", {});
      setDone(res.data?.message ?? "Thank you — your response has been recorded.");
    } else {
      setStepError(res.error ?? "We couldn't submit your response. Please try again.");
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-positive/30 bg-positive/5 p-8 text-center">
        <p className="text-base font-semibold text-navy-900">Response recorded</p>
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
    <form onSubmit={onSubmit} noValidate className="relative">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <StepProgress steps={STEPS} index={steps.index} onGoTo={steps.goTo} />
      <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-navy-50">
        <div
          className="h-full rounded-full bg-navy-900 transition-all"
          style={{ width: `${Math.max(8, ((steps.index + 1) / steps.total) * 100)}%` }}
        />
      </div>

      <div className="mt-6">
        {steps.current.id === "you" && (
          <StepPanel stepKey="you" title="About you">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Your name" required value={s.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
              <TextInput label="Email" type="email" required value={s.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
              <SelectInput label="Where do you live?" options={COUNTRY_OPTIONS} value={s.country} onChange={(e) => set("country", e.target.value)} wrapClassName="sm:col-span-2" />
            </div>
            <ChoiceGroup
              label="Which best describes you?"
              options={SEGMENTS as unknown as readonly string[]}
              value={s.segment}
              onChange={(v) => set("segment", v)}
              columns={3}
            />
          </StepPanel>
        )}

        {steps.current.id === "properties" && (
          <StepPanel stepKey="properties" title="Your properties">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label="How many properties do you own?" options={PROPERTY_COUNT_OPTIONS} value={s.propertyCount} onChange={(e) => set("propertyCount", e.target.value)} required />
              <TextInput label="Which areas?" placeholder="e.g. Accra, Kumasi" value={s.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <ChoiceGroup
              label="How are they managed today?"
              options={MGMT_OPTIONS as unknown as readonly string[]}
              value={s.currentManagement}
              onChange={(v) => set("currentManagement", v)}
              columns={3}
            />
          </StepPanel>
        )}

        {steps.current.id === "challenges" && (
          <StepPanel stepKey="challenges" title="Your challenges" description="Pick everything that applies.">
            <MultiChoice
              label="What makes owning property harder than it should be?"
              options={CHALLENGES}
              values={s.challenges}
              onChange={(v) => set("challenges", v)}
            />
            <TextArea
              label="If you had to name one, what's the biggest?"
              rows={3}
              value={s.biggestChallenge}
              onChange={(e) => set("biggestChallenge", e.target.value)}
            />
          </StepPanel>
        )}

        {steps.current.id === "needs" && (
          <StepPanel stepKey="needs" title="What you need">
            <MultiChoice
              label="Which services would you value most?"
              options={SERVICE_OPTIONS}
              values={s.services}
              onChange={(v) => set("services", v)}
            />
            <ChoiceGroup label="How often would you want reporting?" options={REPORTING as unknown as readonly string[]} value={s.reporting} onChange={(v) => set("reporting", v)} columns={2} />
            <ChoiceGroup label="How important is online access to your property information?" options={TECH as unknown as readonly string[]} value={s.technology} onChange={(v) => set("technology", v)} columns={3} />
            <ChoiceGroup label="Would you consider a professional management company?" options={WILLING as unknown as readonly string[]} value={s.willingToUsePro} onChange={(v) => set("willingToUsePro", v)} columns={3} />
          </StepPanel>
        )}

        {steps.current.id === "contact" && (
          <StepPanel stepKey="contact" title="Contact" description="So we can share the findings and follow up if you'd like.">
            <TextInput label="Phone" type="tel" required placeholder="+233…" value={s.phone} onChange={(e) => set("phone", e.target.value)} hint="Include the country code." />
            <ConsentCheckbox
              checked={consent}
              onChange={(v) => {
                setConsent(v);
                setStepError(null);
              }}
              wording={CONSENT_WORDING}
            />
          </StepPanel>
        )}
      </div>

      <FormError message={stepError} />
      <StepNav
        isFirst={steps.isFirst}
        isLast={steps.isLast}
        onBack={steps.back}
        submitting={submitting}
        submitLabel="Submit survey"
      />
    </form>
  );
}
