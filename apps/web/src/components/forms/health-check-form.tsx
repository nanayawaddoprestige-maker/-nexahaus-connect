"use client";

import { useMemo, useRef, useState } from "react";
import { propertyHealthCheckSchema } from "@nexahaus/validation";
import { submitPublic } from "@/lib/submit-public";
import { track } from "@/lib/analytics";
import {
  COUNTRY_OPTIONS,
  PROPERTY_TYPES,
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
import { ChoiceGroup, YesNo, MultiChoice } from "./choice";
import { useSteps, StepProgress, StepPanel, StepNav } from "./steps";
import { ScoreResult } from "./score-result";

const CONSENT_WORDING =
  "I agree that NexaHaus may contact me about my property assessment and its services. I can opt out at any time.";

const STEPS = [
  { id: "you", label: "About you" },
  { id: "property", label: "Your property" },
  { id: "management", label: "Management" },
  { id: "money", label: "Money & records" },
  { id: "upkeep", label: "Upkeep" },
  { id: "needs", label: "What matters" },
];

type Pace = "ALWAYS" | "USUALLY" | "SOMETIMES" | "RARELY";
type Freq = "MONTHLY" | "QUARTERLY" | "YEARLY" | "NEVER";
type Who = "SELF" | "CARETAKER" | "AGENT" | "MANAGER" | "FAMILY" | "OTHER";

type State = {
  contactName: string;
  email: string;
  phone: string;
  country: string;
  propertyCount: string;
  propertyType: string;
  location: string;
  occupied: boolean | null;
  managedProfessionally: boolean | null;
  rentCollection: Who | "";
  maintenanceHandler: Who | "";
  tenantsPayOnTime: Pace | "";
  receivesFinancialReports: boolean | null;
  documentsInOrder: boolean | null;
  inspectionFrequency: Freq | "";
  lastMaintenanceRecent: boolean | null;
  biggestChallenge: string;
  serviceInterest: string[];
};

const INIT: State = {
  contactName: "",
  email: "",
  phone: "",
  country: "",
  propertyCount: "1",
  propertyType: "",
  location: "",
  occupied: null,
  managedProfessionally: null,
  rentCollection: "",
  maintenanceHandler: "",
  tenantsPayOnTime: "",
  receivesFinancialReports: null,
  documentsInOrder: null,
  inspectionFrequency: "",
  lastMaintenanceRecent: null,
  biggestChallenge: "",
  serviceInterest: [],
};

const WHO_OPTIONS: { value: Who; label: string }[] = [
  { value: "SELF", label: "I do" },
  { value: "FAMILY", label: "A family member" },
  { value: "CARETAKER", label: "A caretaker" },
  { value: "AGENT", label: "An agent" },
  { value: "MANAGER", label: "A management company" },
  { value: "OTHER", label: "Someone else" },
];

export function HealthCheckForm() {
  const [s, setS] = useState<State>(INIT);
  const [honeypot, setHoneypot] = useState("");
  const [consent, setConsent] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    preliminaryScore: number;
    band: string;
    headline: string;
  } | null>(null);
  const startedRef = useRef(false);

  const steps = useSteps(STEPS);
  const set = <K extends keyof State>(k: K, v: State[K]) => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_started", { form: "health_check" });
    }
    setS((prev) => ({ ...prev, [k]: v }));
    setStepError(null);
  };

  const stepValid = useMemo(() => {
    switch (steps.current.id) {
      case "you":
        return (
          s.contactName.trim().length >= 2 &&
          /.+@.+\..+/.test(s.email) &&
          s.phone.trim().length >= 7
        );
      case "property":
        return !!s.propertyCount && s.occupied !== null;
      case "management":
        return (
          s.managedProfessionally !== null &&
          !!s.rentCollection &&
          !!s.maintenanceHandler
        );
      case "money":
        return (
          !!s.tenantsPayOnTime &&
          s.receivesFinancialReports !== null &&
          s.documentsInOrder !== null
        );
      case "upkeep":
        return !!s.inspectionFrequency && s.lastMaintenanceRecent !== null;
      case "needs":
        return consent;
      default:
        return true;
    }
  }, [steps, s, consent]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    if (!stepValid) {
      setStepError(
        steps.current.id === "needs"
          ? "Please agree to be contacted."
          : "Please answer every question on this step.",
      );
      return;
    }
    if (!steps.isLast) {
      steps.next();
      return;
    }

    const payload = {
      contactName: s.contactName.trim(),
      email: s.email.trim(),
      phone: s.phone.trim(),
      livesInGhana: s.country ? s.country === "Ghana" : true,
      location: s.location.trim() || undefined,
      propertyType: s.propertyType || undefined,
      propertyCount: parsePropertyCount(s.propertyCount) ?? 1,
      answers: {
        occupied: !!s.occupied,
        managedProfessionally: !!s.managedProfessionally,
        tenantsPayOnTime: s.tenantsPayOnTime as Pace,
        inspectionFrequency: s.inspectionFrequency as Freq,
        receivesFinancialReports: !!s.receivesFinancialReports,
        documentsInOrder: !!s.documentsInOrder,
        lastMaintenanceRecent: !!s.lastMaintenanceRecent,
      },
      rentCollection: s.rentCollection || undefined,
      maintenanceHandler: s.maintenanceHandler || undefined,
      biggestChallenge: s.biggestChallenge.trim() || undefined,
      serviceInterest: s.serviceInterest.length ? s.serviceInterest : undefined,
      consent: { marketing: true as const, wording: CONSENT_WORDING },
    };

    const parsed = propertyHealthCheckSchema.safeParse(payload);
    if (!parsed.success) {
      setStepError(
        "Something in your answers looks off. Please review and try again.",
      );
      return;
    }

    setSubmitting(true);
    const res = await submitPublic<{
      preliminaryScore: number;
      band: string;
      headline: string;
    }>("/property-health-check", parsed.data, { honeypot });
    setSubmitting(false);
    if (res.ok && res.data) {
      track("form_completed", { form: "health_check" });
      track("health_check_completed", {
        score: res.data.preliminaryScore,
        band: res.data.band,
      });
      setResult(res.data);
    } else {
      setStepError(
        res.error ?? "We couldn't score your property. Please try again.",
      );
    }
  }

  if (result) {
    return (
      <ScoreResult
        score={result.preliminaryScore}
        headline={result.headline}
        disclaimer="This is a preliminary digital assessment based on your own answers. It is not a professional property assessment or valuation. For a full picture, request a professional property assessment from NexaHaus."
        primary={{
          label: "Request a professional assessment",
          href: "/contact",
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <StepProgress steps={STEPS} index={steps.index} onGoTo={steps.goTo} />
      <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-navy-50">
        <div
          className="h-full rounded-full bg-navy-900 transition-all"
          style={{
            width: `${Math.max(8, ((steps.index + 1) / steps.total) * 100)}%`,
          }}
        />
      </div>

      <div className="mt-6">
        {steps.current.id === "you" && (
          <StepPanel
            stepKey="you"
            title="About you"
            description="So we can send your result and follow up if you want us to."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Your name"
                required
                value={s.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                autoComplete="name"
              />
              <TextInput
                label="Email"
                type="email"
                required
                value={s.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
              />
              <TextInput
                label="Phone"
                type="tel"
                required
                placeholder="+233…"
                value={s.phone}
                onChange={(e) => set("phone", e.target.value)}
                hint="Include the country code."
              />
              <SelectInput
                label="Where do you live?"
                options={COUNTRY_OPTIONS}
                value={s.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </div>
          </StepPanel>
        )}

        {steps.current.id === "property" && (
          <StepPanel
            stepKey="property"
            title="Your property"
            description="If you have more than one, answer for the one you most want reviewed."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput
                label="How many properties do you own?"
                options={PROPERTY_COUNT_OPTIONS}
                value={s.propertyCount}
                onChange={(e) => set("propertyCount", e.target.value)}
                required
              />
              <SelectInput
                label="Property type"
                options={PROPERTY_TYPES}
                value={s.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              />
              <TextInput
                label="Where is it?"
                placeholder="e.g. East Legon, Accra"
                value={s.location}
                onChange={(e) => set("location", e.target.value)}
                wrapClassName="sm:col-span-2"
              />
            </div>
            <YesNo
              label="Is it currently occupied?"
              value={s.occupied}
              onChange={(v) => set("occupied", v)}
            />
          </StepPanel>
        )}

        {steps.current.id === "management" && (
          <StepPanel stepKey="management" title="How it's managed today">
            <YesNo
              label="Is it managed by a professional company?"
              value={s.managedProfessionally}
              onChange={(v) => set("managedProfessionally", v)}
            />
            <ChoiceGroup
              label="Who collects the rent?"
              options={WHO_OPTIONS}
              value={s.rentCollection}
              onChange={(v) => set("rentCollection", v)}
              columns={3}
            />
            <ChoiceGroup
              label="Who handles maintenance?"
              options={WHO_OPTIONS}
              value={s.maintenanceHandler}
              onChange={(v) => set("maintenanceHandler", v)}
              columns={3}
            />
          </StepPanel>
        )}

        {steps.current.id === "money" && (
          <StepPanel stepKey="money" title="Money and records">
            <ChoiceGroup
              label="Do tenants pay on time?"
              options={[
                { value: "ALWAYS", label: "Always" },
                { value: "USUALLY", label: "Usually" },
                { value: "SOMETIMES", label: "Sometimes" },
                { value: "RARELY", label: "Rarely" },
              ]}
              value={s.tenantsPayOnTime}
              onChange={(v) => set("tenantsPayOnTime", v)}
            />
            <YesNo
              label="Do you receive regular financial reports?"
              value={s.receivesFinancialReports}
              onChange={(v) => set("receivesFinancialReports", v)}
            />
            <YesNo
              label="Are the property documents in order (title, tenancy, insurance)?"
              value={s.documentsInOrder}
              onChange={(v) => set("documentsInOrder", v)}
            />
          </StepPanel>
        )}

        {steps.current.id === "upkeep" && (
          <StepPanel stepKey="upkeep" title="Upkeep">
            <ChoiceGroup
              label="How often is the property inspected?"
              options={[
                { value: "MONTHLY", label: "Monthly" },
                { value: "QUARTERLY", label: "Quarterly" },
                { value: "YEARLY", label: "Yearly" },
                { value: "NEVER", label: "Never" },
              ]}
              value={s.inspectionFrequency}
              onChange={(v) => set("inspectionFrequency", v)}
            />
            <YesNo
              label="Has maintenance been done in the last 6 months (if needed)?"
              value={s.lastMaintenanceRecent}
              onChange={(v) => set("lastMaintenanceRecent", v)}
            />
          </StepPanel>
        )}

        {steps.current.id === "needs" && (
          <StepPanel
            stepKey="needs"
            title="What matters most"
            description="Optional, but it helps us give you a more useful follow-up."
          >
            <TextArea
              label="Your biggest property-management challenge"
              rows={3}
              value={s.biggestChallenge}
              onChange={(e) => set("biggestChallenge", e.target.value)}
            />
            <MultiChoice
              label="Which services would you value most?"
              options={SERVICE_OPTIONS}
              values={s.serviceInterest as (typeof SERVICE_OPTIONS)[number][]}
              onChange={(v) => set("serviceInterest", v)}
            />
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
        nextLabel="Continue"
        submitLabel="Get my health score"
      />
    </form>
  );
}
