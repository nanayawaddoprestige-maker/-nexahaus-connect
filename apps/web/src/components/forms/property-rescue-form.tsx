"use client";

import { useMemo, useRef, useState } from "react";
import { propertyRescueSchema } from "@nexahaus/validation";
import { submitPublic } from "@/lib/submit-public";
import { track } from "@/lib/analytics";
import {
  PROPERTY_TYPES,
  PROPERTY_COUNT_OPTIONS,
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
import { ChoiceGroup, YesNo } from "./choice";
import { useSteps, StepProgress, StepPanel, StepNav } from "./steps";
import { ScoreResult } from "./score-result";

const CONSENT_WORDING =
  "I agree that NexaHaus may contact me about this assessment and its services. I can opt out at any time.";

const STEPS = [
  { id: "property", label: "Property" },
  { id: "management", label: "Management" },
  { id: "finance", label: "Finance" },
  { id: "maintenance", label: "Maintenance" },
  { id: "occupancy", label: "Occupancy" },
  { id: "you", label: "About you" },
];

type A = {
  occupancy:
    | ""
    | "FULLY_OCCUPIED"
    | "PARTLY_VACANT"
    | "MOSTLY_VACANT"
    | "VACANT";
  rentVsMarket: "" | "ABOVE" | "AT" | "BELOW" | "NOT_SURE";
  collectionReliability: "" | "ALWAYS" | "USUALLY" | "SOMETIMES" | "RARELY";
  arrears: boolean | null;
  maintenanceBacklog: "" | "NONE" | "MINOR" | "SIGNIFICANT" | "SEVERE";
  conditionConcerns: boolean | null;
  lastInspection: "" | "WITHIN_3M" | "WITHIN_12M" | "OVER_12M" | "NEVER";
  documentsInOrder: boolean | null;
  professionallyManaged: boolean | null;
  knowsExpenses: boolean | null;
};

type State = {
  name: string;
  email: string;
  phone: string;
  propertyLocation: string;
  propertyType: string;
  propertyCount: string;
  ownerLocation: "" | "GHANA" | "ABROAD";
  biggestConcern: string;
  a: A;
};

const INIT: State = {
  name: "",
  email: "",
  phone: "",
  propertyLocation: "",
  propertyType: "",
  propertyCount: "1",
  ownerLocation: "",
  biggestConcern: "",
  a: {
    occupancy: "",
    rentVsMarket: "",
    collectionReliability: "",
    arrears: null,
    maintenanceBacklog: "",
    conditionConcerns: null,
    lastInspection: "",
    documentsInOrder: null,
    professionallyManaged: null,
    knowsExpenses: null,
  },
};

type RescueResponse = {
  preliminaryScore: number;
  band: string;
  headline: string;
  findings: { area: string; note: string }[];
};

export function PropertyRescueForm() {
  const [s, setS] = useState<State>(INIT);
  const [honeypot, setHoneypot] = useState("");
  const [consent, setConsent] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RescueResponse | null>(null);
  const startedRef = useRef(false);

  const steps = useSteps(STEPS);
  const setA = <K extends keyof A>(k: K, v: A[K]) => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_started", { form: "property_rescue" });
    }
    setS((p) => ({ ...p, a: { ...p.a, [k]: v } }));
    setStepError(null);
  };
  const set = <K extends keyof State>(k: K, v: State[K]) => {
    setS((p) => ({ ...p, [k]: v }));
    setStepError(null);
  };

  const stepValid = useMemo(() => {
    const a = s.a;
    switch (steps.current.id) {
      case "property":
        return !!s.propertyCount;
      case "management":
        return (
          a.professionallyManaged !== null &&
          !!a.collectionReliability &&
          a.documentsInOrder !== null
        );
      case "finance":
        return (
          !!a.rentVsMarket && a.arrears !== null && a.knowsExpenses !== null
        );
      case "maintenance":
        return (
          !!a.maintenanceBacklog &&
          a.conditionConcerns !== null &&
          !!a.lastInspection
        );
      case "occupancy":
        return !!a.occupancy;
      case "you":
        return (
          s.name.trim().length >= 2 &&
          /.+@.+\..+/.test(s.email) &&
          s.phone.trim().length >= 7 &&
          !!s.ownerLocation &&
          consent
        );
      default:
        return true;
    }
  }, [steps, s, consent]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    if (!stepValid) {
      setStepError(
        steps.current.id === "you"
          ? "Please complete your details and agree to be contacted."
          : "Please answer every question on this step.",
      );
      return;
    }
    if (!steps.isLast) {
      steps.next();
      return;
    }

    const a = s.a;
    const payload = {
      name: s.name.trim(),
      email: s.email.trim(),
      phone: s.phone.trim(),
      propertyLocation: s.propertyLocation.trim() || undefined,
      propertyType: s.propertyType || undefined,
      propertyCount: parsePropertyCount(s.propertyCount) ?? 1,
      ownerLocation: s.ownerLocation as "GHANA" | "ABROAD",
      answers: {
        occupancy: a.occupancy as Exclude<A["occupancy"], "">,
        rentVsMarket: a.rentVsMarket as Exclude<A["rentVsMarket"], "">,
        collectionReliability: a.collectionReliability as Exclude<
          A["collectionReliability"],
          ""
        >,
        arrears: !!a.arrears,
        maintenanceBacklog: a.maintenanceBacklog as Exclude<
          A["maintenanceBacklog"],
          ""
        >,
        conditionConcerns: !!a.conditionConcerns,
        lastInspection: a.lastInspection as Exclude<A["lastInspection"], "">,
        documentsInOrder: !!a.documentsInOrder,
        professionallyManaged: !!a.professionallyManaged,
        knowsExpenses: !!a.knowsExpenses,
      },
      biggestConcern: s.biggestConcern.trim() || undefined,
      consent: { marketing: true as const, wording: CONSENT_WORDING },
    };

    const parsed = propertyRescueSchema.safeParse(payload);
    if (!parsed.success) {
      setStepError(
        "Something in your answers looks off. Please review and try again.",
      );
      return;
    }

    setSubmitting(true);
    const res = await submitPublic<RescueResponse>(
      "/property-rescue",
      parsed.data,
      { honeypot },
    );
    setSubmitting(false);
    if (res.ok && res.data) {
      track("form_completed", { form: "property_rescue" });
      track("property_rescue_requested", {
        score: res.data.preliminaryScore,
        band: res.data.band,
      });
      setResult(res.data);
    } else {
      setStepError(
        res.error ?? "We couldn't complete the assessment. Please try again.",
      );
    }
  }

  if (result) {
    return (
      <ScoreResult
        score={result.preliminaryScore}
        headline={result.headline}
        disclaimer="This preliminary digital result is an indicative management assessment and does not constitute a professional property valuation, legal advice or investment advice."
        primary={{
          label: "Request a professional assessment",
          href: "/contact",
        }}
        primaryEvent="property_rescue_requested"
        breakdown={result.findings.slice(0, 6)}
      />
    );
  }

  const a = s.a;
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
        {steps.current.id === "property" && (
          <StepPanel
            stepKey="property"
            title="The property"
            description="Answer for the property you want assessed."
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
                placeholder="e.g. Spintex, Accra"
                value={s.propertyLocation}
                onChange={(e) => set("propertyLocation", e.target.value)}
                wrapClassName="sm:col-span-2"
              />
            </div>
          </StepPanel>
        )}

        {steps.current.id === "management" && (
          <StepPanel stepKey="management" title="Management">
            <YesNo
              label="Is the property professionally managed?"
              value={a.professionallyManaged}
              onChange={(v) => setA("professionallyManaged", v)}
            />
            <ChoiceGroup
              label="How reliable is rent collection?"
              options={[
                { value: "ALWAYS", label: "Always on time" },
                { value: "USUALLY", label: "Usually" },
                { value: "SOMETIMES", label: "Sometimes" },
                { value: "RARELY", label: "Rarely" },
              ]}
              value={a.collectionReliability}
              onChange={(v) => setA("collectionReliability", v)}
            />
            <YesNo
              label="Are the key documents in order (title, tenancy, insurance)?"
              value={a.documentsInOrder}
              onChange={(v) => setA("documentsInOrder", v)}
            />
          </StepPanel>
        )}

        {steps.current.id === "finance" && (
          <StepPanel stepKey="finance" title="Finance">
            <ChoiceGroup
              label="How does the rent compare to the local market?"
              options={[
                { value: "ABOVE", label: "Above market" },
                { value: "AT", label: "About right" },
                { value: "BELOW", label: "Below market" },
                { value: "NOT_SURE", label: "Not sure" },
              ]}
              value={a.rentVsMarket}
              onChange={(v) => setA("rentVsMarket", v)}
            />
            <YesNo
              label="Are there outstanding rent arrears?"
              value={a.arrears}
              onChange={(v) => setA("arrears", v)}
            />
            <YesNo
              label="Do you have a clear picture of the property's operating costs?"
              value={a.knowsExpenses}
              onChange={(v) => setA("knowsExpenses", v)}
            />
          </StepPanel>
        )}

        {steps.current.id === "maintenance" && (
          <StepPanel stepKey="maintenance" title="Maintenance & condition">
            <ChoiceGroup
              label="How big is the maintenance backlog?"
              options={[
                { value: "NONE", label: "None" },
                { value: "MINOR", label: "Minor" },
                { value: "SIGNIFICANT", label: "Significant" },
                { value: "SEVERE", label: "Severe" },
              ]}
              value={a.maintenanceBacklog}
              onChange={(v) => setA("maintenanceBacklog", v)}
            />
            <YesNo
              label="Do you have concerns about the property's condition?"
              value={a.conditionConcerns}
              onChange={(v) => setA("conditionConcerns", v)}
            />
            <ChoiceGroup
              label="When was it last inspected?"
              options={[
                { value: "WITHIN_3M", label: "Within 3 months" },
                { value: "WITHIN_12M", label: "Within a year" },
                { value: "OVER_12M", label: "Over a year ago" },
                { value: "NEVER", label: "Never" },
              ]}
              value={a.lastInspection}
              onChange={(v) => setA("lastInspection", v)}
            />
          </StepPanel>
        )}

        {steps.current.id === "occupancy" && (
          <StepPanel stepKey="occupancy" title="Occupancy">
            <ChoiceGroup
              label="What is the current occupancy?"
              options={[
                { value: "FULLY_OCCUPIED", label: "Fully occupied" },
                { value: "PARTLY_VACANT", label: "Partly vacant" },
                { value: "MOSTLY_VACANT", label: "Mostly vacant" },
                { value: "VACANT", label: "Vacant" },
              ]}
              value={a.occupancy}
              onChange={(v) => setA("occupancy", v)}
            />
          </StepPanel>
        )}

        {steps.current.id === "you" && (
          <StepPanel
            stepKey="you"
            title="About you"
            description="So we can send your result and follow up."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Your name"
                required
                value={s.name}
                onChange={(e) => set("name", e.target.value)}
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
            </div>
            <ChoiceGroup
              label="Where do you live?"
              options={[
                { value: "GHANA", label: "In Ghana" },
                { value: "ABROAD", label: "Outside Ghana" },
              ]}
              value={s.ownerLocation}
              onChange={(v) => set("ownerLocation", v)}
            />
            <TextArea
              label="What's your biggest concern about this property?"
              rows={3}
              value={s.biggestConcern}
              onChange={(e) => set("biggestConcern", e.target.value)}
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
        submitLabel="Get my Property Rescue score"
      />
    </form>
  );
}
