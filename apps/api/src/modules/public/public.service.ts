import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  AttributionInput,
  ContactEnquiryInput,
  EarlyAccessInput,
  PropertyHealthCheckInput,
  PropertyOwnerSurveyInput,
  PropertyRescueInput,
  SurveyResponseInput,
} from "@nexahaus/validation";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService } from "../../audit/audit.service";
import { computeLeadScore } from "../crm/lead-scoring.util";
import { scoreHealthCheck } from "./public-health-check.util";
import { scoreRescue } from "./property-rescue.util";

/** Consent-record evidence blob, shared shape across the public endpoints. */
function evidence(
  consent: { marketing: boolean; wording?: string },
  ipHash: string,
  attribution?: AttributionInput,
): Prisma.InputJsonValue {
  return { ...consent, ipHash, attribution: attribution ?? null } as Prisma.InputJsonValue;
}

/** Derive a CRM campaign string from attribution, if present. */
function campaignFrom(attribution?: AttributionInput): string | undefined {
  return attribution?.utm_campaign ?? undefined;
}

/**
 * Public (unauthenticated) lead-capture funnel: Property Health Check, Early
 * Access / Founding 100, and survey submissions. Every entry point records
 * explicit consent and creates or updates a CRM Lead. No personal data is
 * placed in a URL.
 */
@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
  ) {}

  async submitHealthCheck(input: PropertyHealthCheckInput, ipHash: string) {
    const result = scoreHealthCheck(input.answers);

    await this.prisma.$transaction(async (tx) => {
      const lead = await this.upsertLead(tx, {
        name: input.contactName,
        email: input.email,
        phone: input.phone,
        source: "WEBSITE",
        campaign: campaignFrom(input.attribution),
        propertyCount: input.propertyCount,
        propertyType: input.propertyType,
        location: input.location,
        livesInGhana: input.livesInGhana,
        serviceInterest: input.serviceInterest,
        biggestChallenge: input.biggestChallenge,
        assessmentCompleted: true,
      });
      await tx.propertyHealthCheck.create({
        data: {
          leadId: lead.id,
          contactName: input.contactName,
          email: input.email,
          phone: input.phone,
          propertyInfo: {
            propertyType: input.propertyType,
            propertyCount: input.propertyCount,
            location: input.location,
            livesInGhana: input.livesInGhana,
            rentCollection: input.rentCollection ?? null,
            maintenanceHandler: input.maintenanceHandler ?? null,
          } as Prisma.InputJsonValue,
          answers: input.answers as Prisma.InputJsonValue,
          preliminaryScore: result.score,
          consent: input.consent as Prisma.InputJsonValue,
        },
      });
      await tx.consentRecord.create({
        data: {
          subjectType: "LEAD",
          subjectId: lead.id,
          purpose: "marketing",
          lawfulBasis: "consent",
          source: "public.health-check",
          evidence: evidence(input.consent, ipHash, input.attribution),
        },
      });
      await this.audit.record(
        {
          actorRoleKey: "PUBLIC",
          action: "public.health_check",
          resourceType: "lead",
          resourceId: lead.id,
          after: { preliminaryScore: result.score, band: result.band },
        },
        tx,
      );
    });

    return {
      preliminaryScore: result.score,
      band: result.band,
      headline: result.headline,
      disclaimer:
        "This is a preliminary digital assessment based on your own answers. It is not a professional property assessment or valuation.",
      nextStep: "Request a professional property assessment from NexaHaus.",
    };
  }

  async registerEarlyAccess(input: EarlyAccessInput, ipHash: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.earlyAccessRegistration.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          propertyCount: input.propertyCount ?? null,
          location: input.location ?? null,
          interest: input.interest ?? null,
          campaign: input.campaign,
        },
      });
      const lead = await this.upsertLead(tx, {
        name: input.name,
        email: input.email,
        phone: input.phone,
        source: "WEBSITE",
        campaign: campaignFrom(input.attribution) ?? input.campaign,
        propertyCount: input.propertyCount,
        location: input.location,
        livesInGhana: input.livesInGhana,
        serviceInterest: input.serviceInterest,
        biggestChallenge: input.interest,
      });
      await tx.consentRecord.create({
        data: {
          subjectType: "LEAD",
          subjectId: lead.id,
          purpose: "marketing",
          lawfulBasis: "consent",
          source: "public.early-access",
          evidence: evidence(input.consent, ipHash, input.attribution),
        },
      });
      await this.audit.record(
        {
          actorRoleKey: "PUBLIC",
          action: "public.early_access",
          resourceType: "lead",
          resourceId: lead.id,
          after: { campaign: input.campaign },
        },
        tx,
      );
    });
    return {
      registered: true,
      message:
        input.campaign === "FOUNDING_100"
          ? "You're on the NexaHaus Founding 100 list. We'll be in touch before launch."
          : "You're on the NexaHaus Early Access list. We'll be in touch before launch.",
    };
  }

  async submitContact(input: ContactEnquiryInput, ipHash: string) {
    await this.prisma.$transaction(async (tx) => {
      const lead = await this.upsertLead(tx, {
        name: input.name,
        email: input.email,
        phone: input.phone,
        source: "WEBSITE",
        campaign: input.attribution?.utm_campaign,
        propertyCount: input.propertyCount ?? null,
        propertyType: input.propertyType ?? null,
        location: input.propertyLocation ?? null,
        livesInGhana: input.livesInGhana ?? null,
        serviceInterest: input.serviceNeeded ? [input.serviceNeeded] : undefined,
        biggestChallenge: input.message.slice(0, 1000),
      });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "NOTE",
          body:
            `Contact enquiry (prefers ${input.preferredContact.toLowerCase()})` +
            (input.country ? ` from ${input.country}` : "") +
            `:\n\n${input.message}`,
        },
      });
      await tx.consentRecord.create({
        data: {
          subjectType: "LEAD",
          subjectId: lead.id,
          purpose: "marketing",
          lawfulBasis: "consent",
          source: "public.contact",
          evidence: {
            ...input.consent,
            ipHash,
            attribution: input.attribution ?? null,
          } as Prisma.InputJsonValue,
        },
      });
      await this.audit.record(
        {
          actorRoleKey: "PUBLIC",
          action: "public.contact",
          resourceType: "lead",
          resourceId: lead.id,
          after: { serviceNeeded: input.serviceNeeded ?? null },
        },
        tx,
      );
    });
    return {
      received: true,
      message:
        "Thank you. Your enquiry has been received. A member of the NexaHaus team will contact you.",
    };
  }

  async submitPropertyRescue(input: PropertyRescueInput, ipHash: string) {
    const result = scoreRescue(input.answers);

    await this.prisma.$transaction(async (tx) => {
      const lead = await this.upsertLead(tx, {
        name: input.name,
        email: input.email,
        phone: input.phone,
        source: "PROPERTY_RESCUE",
        campaign: campaignFrom(input.attribution),
        propertyCount: input.propertyCount,
        propertyType: input.propertyType,
        location: input.propertyLocation ?? null,
        livesInGhana: input.ownerLocation === "GHANA",
        biggestChallenge: input.biggestConcern,
        assessmentCompleted: true,
      });
      await tx.propertyHealthCheck.create({
        data: {
          leadId: lead.id,
          contactName: input.name,
          email: input.email,
          phone: input.phone,
          propertyInfo: {
            kind: "PROPERTY_RESCUE",
            propertyType: input.propertyType,
            propertyCount: input.propertyCount,
            location: input.propertyLocation,
            ownerLocation: input.ownerLocation,
          } as Prisma.InputJsonValue,
          answers: input.answers as Prisma.InputJsonValue,
          preliminaryScore: result.score,
          consent: input.consent as Prisma.InputJsonValue,
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "NOTE",
          body:
            `Property Rescue — preliminary score ${result.score}/100 (${result.band}).\n` +
            `Top findings: ${result.findings.slice(0, 4).map((f) => f.area).join(", ") || "none"}.` +
            (input.biggestConcern ? `\nOwner's concern: ${input.biggestConcern}` : ""),
        },
      });
      await tx.consentRecord.create({
        data: {
          subjectType: "LEAD",
          subjectId: lead.id,
          purpose: "marketing",
          lawfulBasis: "consent",
          source: "public.property-rescue",
          evidence: evidence(input.consent, ipHash, input.attribution),
        },
      });
      await this.audit.record(
        {
          actorRoleKey: "PUBLIC",
          action: "public.property_rescue",
          resourceType: "lead",
          resourceId: lead.id,
          after: { preliminaryScore: result.score, band: result.band },
        },
        tx,
      );
    });

    return {
      preliminaryScore: result.score,
      band: result.band,
      headline: result.headline,
      findings: result.findings.map((f) => ({ area: f.area, note: f.note })),
      disclaimer:
        "This preliminary digital result is an indicative management assessment and does not constitute a professional property valuation, legal advice or investment advice.",
      nextStep: "Request a professional assessment from NexaHaus.",
    };
  }

  async submitPropertyOwnerSurvey(input: PropertyOwnerSurveyInput, ipHash: string) {
    await this.prisma.$transaction(async (tx) => {
      const lead = await this.upsertLead(tx, {
        name: input.name,
        email: input.email,
        phone: input.phone,
        source: "WEBSITE",
        campaign: campaignFrom(input.attribution) ?? "PROPERTY_OWNER_SURVEY",
        propertyCount: input.propertyCount ?? null,
        location: input.location ?? null,
        livesInGhana: input.livesInGhana,
        serviceInterest: input.serviceInterest,
        biggestChallenge: input.biggestChallenge,
      });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "NOTE",
          body:
            "Property Owner Survey response:\n" +
            Object.entries(input.answers)
              .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
              .join("\n"),
        },
      });
      await tx.consentRecord.create({
        data: {
          subjectType: "LEAD",
          subjectId: lead.id,
          purpose: "marketing",
          lawfulBasis: "consent",
          source: "public.property-owner-survey",
          evidence: evidence(input.consent, ipHash, input.attribution),
        },
      });
      await this.audit.record(
        {
          actorRoleKey: "PUBLIC",
          action: "public.property_owner_survey",
          resourceType: "lead",
          resourceId: lead.id,
          after: { answerCount: Object.keys(input.answers).length },
        },
        tx,
      );
    });
    return {
      submitted: true,
      message:
        "Thank you. Your responses help us build NexaHaus around what property owners actually need.",
    };
  }

  async getSurvey(key: string) {
    const survey = await this.prisma.survey.findFirst({
      where: { key, status: "PUBLISHED" },
      include: { questions: { orderBy: { sortOrder: "asc" } } },
    });
    if (!survey) throw AppError.notFound("survey");
    return {
      key: survey.key,
      name: survey.name,
      version: survey.version,
      questions: survey.questions.map((q) => ({
        id: q.id,
        order: q.sortOrder,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        required: q.required,
      })),
    };
  }

  async submitSurvey(key: string, input: SurveyResponseInput, ipHash: string) {
    const survey = await this.prisma.survey.findFirst({
      where: { key, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!survey) throw AppError.notFound("survey");

    await this.prisma.$transaction(async (tx) => {
      let leadId: string | null = null;
      if (input.leadEmail) {
        const lead = await this.upsertLead(tx, {
          name: (input.answers.name as string | undefined) ?? "Survey respondent",
          email: input.leadEmail,
          phone: (input.answers.phone as string | undefined) ?? "+233000000000",
          source: "WEBSITE",
        });
        leadId = lead.id;
      }
      await tx.surveyResponse.create({
        data: {
          surveyId: survey.id,
          leadId,
          answers: input.answers as Prisma.InputJsonValue,
          consent: input.consent ? (input.consent as Prisma.InputJsonValue) : undefined,
          ipHash,
        },
      });
      if (leadId && input.consent?.marketing) {
        await tx.consentRecord.create({
          data: {
            subjectType: "LEAD",
            subjectId: leadId,
            purpose: "marketing",
            lawfulBasis: "consent",
            source: "public.survey",
            evidence: { ...input.consent, ipHash } as Prisma.InputJsonValue,
          },
        });
      }
    });
    return { submitted: true, message: "Thank you — your response has been recorded." };
  }

  /** Match an inbound public contact to an existing lead by email, else create. */
  private async upsertLead(
    tx: Prisma.TransactionClient,
    data: {
      name: string;
      email: string;
      phone: string;
      source: string;
      campaign?: string;
      propertyCount?: number | null;
      propertyType?: string | null;
      location?: string | null;
      livesInGhana?: boolean | null;
      serviceInterest?: string[];
      biggestChallenge?: string;
      assessmentCompleted?: boolean;
    },
  ) {
    const existing = await tx.lead.findFirst({
      where: { email: { equals: data.email, mode: "insensitive" } },
      select: {
        id: true,
        propertyCount: true,
        location: true,
        livesInGhana: true,
        biggestChallenge: true,
        serviceInterest: true,
      },
    });

    const scored = computeLeadScore({
      propertyCount: data.propertyCount ?? existing?.propertyCount,
      livesInGhana: data.livesInGhana ?? existing?.livesInGhana,
      location: data.location ?? existing?.location,
      biggestChallenge: data.biggestChallenge ?? existing?.biggestChallenge,
      serviceInterest: data.serviceInterest ?? existing?.serviceInterest,
      assessmentCompleted: data.assessmentCompleted,
    });

    if (existing) {
      return tx.lead.update({
        where: { id: existing.id },
        data: {
          phone: data.phone,
          name: data.name,
          propertyCount: data.propertyCount ?? undefined,
          propertyType: data.propertyType ?? undefined,
          location: data.location ?? undefined,
          livesInGhana: data.livesInGhana ?? undefined,
          biggestChallenge: data.biggestChallenge ?? undefined,
          serviceInterest:
            data.serviceInterest && data.serviceInterest.length > 0
              ? Array.from(new Set([...(existing.serviceInterest ?? []), ...data.serviceInterest]))
              : undefined,
          score: scored.score,
          grade: scored.grade,
        },
      });
    }
    const ref = await this.refs.next("lead", tx);
    return tx.lead.create({
      data: {
        ref,
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: data.source as never,
        campaign: data.campaign ?? null,
        propertyCount: data.propertyCount ?? null,
        propertyType: data.propertyType ?? null,
        location: data.location ?? null,
        livesInGhana: data.livesInGhana ?? null,
        serviceInterest: data.serviceInterest ?? [],
        biggestChallenge: data.biggestChallenge ?? null,
        score: scored.score,
        grade: scored.grade,
        status: "NEW",
      },
    });
  }
}

export function hashIp(ip: string | undefined): string {
  return createHash("sha256").update(ip ?? "unknown").digest("hex").slice(0, 32);
}
