import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AppConfig } from "@nexahaus/config";
import type { AuthUser } from "@nexahaus/types";
import type {
  ClientContactInput,
  CreateClientInput,
  InviteClientUserInput,
  ListClientQuery,
  UpdateClientInput,
} from "@nexahaus/validation";
import { APP_CONFIG } from "../../config/config.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { pageParams, paginate, parseSort } from "../../common/pagination";
import { clientScopeWhere, clientInScope } from "../authz/scope.util";
import { periodRange } from "../finance/period.util";
import { EmailAdapter } from "../notifications/channels/channel-adapter";
import { ownerInviteEmail } from "./client-invite-email";

const INVITE_TTL_HOURS = 72;

const SORTABLE = ["createdAt", "displayName", "ref", "status"] as const;

const ONBOARDING_STEPS = [
  "Create account",
  "Verify email / phone",
  "Complete profile",
  "KYC information",
  "Add / confirm properties",
  "Upload required documents",
  "Review management agreement",
  "Accept / sign agreement",
  "Property onboarding inspection",
  "Property activated",
];

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
    private readonly emailAdapter: EmailAdapter,
  ) {}

  async list(user: AuthUser, query: ListClientQuery) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.ClientWhereInput = {
      AND: [
        clientScopeWhere(user),
        query.status ? { status: query.status } : {},
        query.segment ? { segment: query.segment } : {},
        query.q
          ? {
              OR: [
                { displayName: { contains: query.q, mode: "insensitive" } },
                { ref: { contains: query.q, mode: "insensitive" } },
                { primaryEmail: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(query.sort, SORTABLE, { createdAt: "desc" }),
        select: {
          id: true,
          ref: true,
          displayName: true,
          type: true,
          segment: true,
          status: true,
          servicePackage: true,
          primaryEmail: true,
          primaryPhone: true,
          countryOfResidence: true,
          _count: { select: { managedProperties: true, users: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return paginate(
      rows.map((r) => ({
        id: r.id,
        ref: r.ref,
        name: r.displayName,
        type: r.type,
        segment: r.segment,
        status: r.status,
        servicePackage: r.servicePackage,
        email: r.primaryEmail,
        phone: r.primaryPhone,
        countryOfResidence: r.countryOfResidence,
        propertyCount: r._count.managedProperties,
        userCount: r._count.users,
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async getById(user: AuthUser, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        accountManager: { select: { id: true, fullName: true } },
        contacts: true,
        onboarding: true,
        users: {
          select: {
            relationship: true,
            canApprove: true,
            acceptedAt: true,
            user: {
              select: { id: true, fullName: true, email: true, status: true },
            },
          },
        },
        _count: { select: { managedProperties: true } },
      },
    });
    if (!client || !clientInScope(user, client.id)) {
      throw AppError.notFound("client");
    }

    return {
      id: client.id,
      ref: client.ref,
      type: client.type,
      displayName: client.displayName,
      legalName: client.legalName,
      segment: client.segment,
      status: client.status,
      servicePackage: client.servicePackage,
      primaryEmail: client.primaryEmail,
      primaryPhone: client.primaryPhone,
      countryOfResidence: client.countryOfResidence,
      accountManager: client.accountManager,
      contacts: client.contacts,
      users: client.users.map((u) => ({
        ...u.user,
        relationship: u.relationship,
        canApprove: u.canApprove,
        accepted: u.acceptedAt !== null,
      })),
      onboarding: client.onboarding
        ? {
            currentStep: client.onboarding.currentStep,
            status: client.onboarding.status,
            kycStatus: client.onboarding.kycStatus,
            agreementAccepted: client.onboarding.agreementAcceptedAt !== null,
            steps: ONBOARDING_STEPS.map((label, i) => ({
              index: i + 1,
              label,
              done: i + 1 < client.onboarding!.currentStep,
              current: i + 1 === client.onboarding!.currentStep,
            })),
            completionPercent: Math.round(
              ((client.onboarding.currentStep - 1) / ONBOARDING_STEPS.length) *
                100,
            ),
          }
        : null,
      propertyCount: client._count.managedProperties,
      createdAt: client.createdAt.toISOString(),
    };
  }

  async portfolioSummary(user: AuthUser, id: string) {
    if (!clientInScope(user, id)) {
      const exists = await this.prisma.client.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      });
      if (!exists || !clientInScope(user, id))
        throw AppError.notFound("client");
    }
    const range = periodRange("this_month");
    const [propertyGroups, rent, openMaintenance] = await Promise.all([
      this.prisma.property.groupBy({
        by: ["status"],
        where: { clientId: id, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.rentCharge.aggregate({
        where: {
          clientId: id,
          dueDate: { gte: range.start, lt: range.end },
          status: { not: "WAIVED" },
        },
        _sum: { amountMinor: true, paidMinor: true },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          property: { clientId: id },
          status: { notIn: ["CLOSED", "CANCELLED", "VERIFIED"] },
        },
      }),
    ]);

    const total = propertyGroups.reduce((s, g) => s + g._count._all, 0);
    const expected = rent._sum.amountMinor ?? 0n;
    const collected = rent._sum.paidMinor ?? 0n;

    return {
      currency: "GHS",
      properties: {
        total,
        occupied:
          propertyGroups.find((g) => g.status === "OCCUPIED")?._count._all ?? 0,
        vacant:
          propertyGroups.find((g) => g.status === "VACANT")?._count._all ?? 0,
      },
      rent: {
        expectedMinor: expected.toString(),
        collectedMinor: collected.toString(),
        outstandingMinor: (expected - collected).toString(),
      },
      openMaintenance,
    };
  }

  async create(user: AuthUser, input: CreateClientInput, ctx: AuditContext) {
    const client = await this.prisma.$transaction(async (tx) => {
      const ref = await this.refs.next("client", tx);
      const created = await tx.client.create({
        data: {
          ref,
          type: input.type,
          displayName: input.displayName,
          legalName: input.legalName ?? null,
          segment: input.segment,
          status: "PROSPECT",
          primaryEmail: input.primaryEmail ?? null,
          primaryPhone: input.primaryPhone ?? null,
          countryOfResidence: input.countryOfResidence ?? null,
          servicePackage: input.servicePackage ?? null,
          accountManagerId: input.accountManagerId ?? null,
          onboarding: { create: { currentStep: 1, status: "IN_PROGRESS" } },
        },
      });
      await this.audit.record(
        {
          ...ctx,
          action: "client.create",
          resourceType: "client",
          resourceId: created.id,
          after: { ref: created.ref, displayName: created.displayName },
        },
        tx,
      );
      return created;
    });
    return this.getById(user, client.id);
  }

  async update(
    user: AuthUser,
    id: string,
    input: UpdateClientInput,
    ctx: AuditContext,
  ) {
    const existing = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing || !clientInScope(user, id))
      throw AppError.notFound("client");

    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        displayName: input.displayName ?? undefined,
        legalName: input.legalName ?? undefined,
        segment: input.segment ?? undefined,
        status: input.status ?? undefined,
        primaryEmail: input.primaryEmail ?? undefined,
        primaryPhone: input.primaryPhone ?? undefined,
        countryOfResidence: input.countryOfResidence ?? undefined,
        servicePackage: input.servicePackage ?? undefined,
        accountManagerId: input.accountManagerId ?? undefined,
      },
    });
    await this.audit.record({
      ...ctx,
      action: "client.update",
      resourceType: "client",
      resourceId: id,
      before: {
        displayName: existing.displayName,
        status: existing.status,
        segment: existing.segment,
      },
      after: { displayName: updated.displayName, status: updated.status },
    });
    return this.getById(user, id);
  }

  async addContact(id: string, input: ClientContactInput, ctx: AuditContext) {
    await this.assertExists(id);
    const contact = await this.prisma.clientContact.create({
      data: {
        clientId: id,
        name: input.name,
        role: input.role ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        isEmergency: input.isEmergency,
      },
    });
    await this.audit.record({
      ...ctx,
      action: "client.contact.add",
      resourceType: "client",
      resourceId: id,
      after: { contactId: contact.id, name: contact.name },
    });
    return contact;
  }

  async inviteUser(
    id: string,
    input: InviteClientUserInput,
    ctx: AuditContext,
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      select: { displayName: true },
    });
    if (!client) throw AppError.notFound("client");
    const email = input.email?.toLowerCase() ?? null;

    const result = await this.prisma.$transaction(async (tx) => {
      let targetUser = await tx.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(input.phone ? [{ phone: input.phone }] : []),
          ],
        },
        select: { id: true },
      });

      let activationToken: string | null = null;
      let isNewUser = false;

      if (!targetUser) {
        // Placeholder user in PENDING_VERIFICATION; they set a password on
        // accepting the invitation via the same account-activation token flow
        // used for staff invites (users.service.ts).
        isNewUser = true;
        targetUser = await tx.user.create({
          data: {
            email,
            phone: input.phone ?? null,
            fullName: input.fullName,
            passwordHash: "!invited",
            status: "PENDING_VERIFICATION",
          },
          select: { id: true },
        });
        const ownerRole = await tx.role.findUnique({ where: { key: "OWNER" } });
        if (ownerRole) {
          await tx.userRole.create({
            data: { userId: targetUser.id, roleId: ownerRole.id },
          });
        }
        if (email) {
          activationToken = randomBytes(32).toString("base64url");
          await tx.accountActivationToken.create({
            data: {
              userId: targetUser.id,
              tokenHash: createHash("sha256")
                .update(activationToken)
                .digest("hex"),
              expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 3_600_000),
            },
          });
        }
      }

      const link = await tx.clientUser.upsert({
        where: { clientId_userId: { clientId: id, userId: targetUser.id } },
        create: {
          clientId: id,
          userId: targetUser.id,
          relationship: input.relationship,
          canApprove: input.canApprove,
          invitedById: ctx.actorUserId ?? null,
        },
        update: {
          relationship: input.relationship,
          canApprove: input.canApprove,
        },
      });

      await this.audit.record(
        {
          ...ctx,
          action: "client.user.invite",
          resourceType: "client",
          resourceId: id,
          after: { userId: targetUser.id, relationship: input.relationship },
        },
        tx,
      );
      return {
        clientUserId: link.id,
        userId: targetUser.id,
        isNewUser,
        activationToken,
      };
    });

    if (result.isNewUser && result.activationToken && email) {
      this.sendInviteEmail(
        email,
        input.fullName,
        client.displayName,
        result.activationToken,
      );
    }

    return {
      clientUserId: result.clientUserId,
      userId: result.userId,
    };
  }

  /** Best-effort — the account is already created; email failure is logged,
   *  not fatal. */
  private sendInviteEmail(
    to: string,
    fullName: string,
    clientName: string,
    token: string,
  ): void {
    const inviteUrl = `${this.config.urls.app}/accept-invite?token=${token}`;
    const template = ownerInviteEmail(
      fullName,
      clientName,
      inviteUrl,
      INVITE_TTL_HOURS,
    );
    this.emailAdapter
      .send({
        to,
        subject: template.subject,
        body: template.text,
        html: template.html,
      })
      .catch((err: unknown) =>
        this.logger.warn(`Owner invite email to ${to} failed: ${String(err)}`),
      );
  }

  async advanceOnboarding(
    id: string,
    input: { step: number; kycStatus?: string; agreementAccepted?: boolean },
    ctx: AuditContext,
  ) {
    await this.assertExists(id);
    const onboarding = await this.prisma.clientOnboarding.findUnique({
      where: { clientId: id },
    });
    if (!onboarding) throw AppError.notFound("client onboarding");

    const complete = input.step >= ONBOARDING_STEPS.length;
    const updated = await this.prisma.clientOnboarding.update({
      where: { clientId: id },
      data: {
        currentStep: input.step,
        kycStatus: (input.kycStatus as never) ?? undefined,
        agreementAcceptedAt: input.agreementAccepted ? new Date() : undefined,
        status: complete ? "COMPLETE" : "IN_PROGRESS",
        completedAt: complete ? new Date() : null,
      },
    });
    if (complete) {
      await this.prisma.client.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
    }
    await this.audit.record({
      ...ctx,
      action: "client.onboarding.advance",
      resourceType: "client",
      resourceId: id,
      before: { step: onboarding.currentStep },
      after: { step: updated.currentStep, status: updated.status },
    });
    return { currentStep: updated.currentStep, status: updated.status };
  }

  private async assertExists(id: string): Promise<void> {
    const exists = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw AppError.notFound("client");
  }
}
