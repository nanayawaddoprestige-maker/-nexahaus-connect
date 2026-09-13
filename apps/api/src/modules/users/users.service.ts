import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AppConfig } from "@nexahaus/config";
import { RoleKey, STAFF_ROLES } from "@nexahaus/types";
import type { AuthUser } from "@nexahaus/types";
import { assertCanModifySuperAdmin, assertCanSetRole } from "./user-role.util";
import type {
  AcceptInviteInput,
  ChangeUserRoleInput,
  ChangeUserStatusInput,
  InviteStaffUserInput,
  ListStaffUserQuery,
} from "@nexahaus/validation";
import { APP_CONFIG } from "../../config/config.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { paginate, pageParams } from "../../common/pagination";
import { PasswordService } from "../auth/password.service";
import { EmailAdapter } from "../notifications/channels/channel-adapter";
import { staffInviteEmail } from "./user-email-templates";

const INVITE_TTL_HOURS = 72;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService,
    private readonly email: EmailAdapter,
  ) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async list(query: ListStaffUserQuery) {
    const { skip, take, page, pageSize } = pageParams(query);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      roles: { some: { role: { key: { in: STAFF_ROLES } } } },
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: "insensitive" } },
              { email: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          roles: { select: { role: { select: { key: true, name: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(
      rows.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        status: u.status,
        role: u.roles[0]?.role ?? null,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
      totalItems,
      page,
      pageSize,
    );
  }

  async invite(
    actor: AuthUser,
    input: InviteStaffUserInput,
    ctx: AuditContext,
  ) {
    assertCanSetRole(actor.roles, input.roleKey);

    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw AppError.conflict("An account with that email already exists.");
    }

    const role = await this.prisma.role.findUnique({
      where: { key: input.roleKey },
    });
    if (!role) throw AppError.validation("Unknown role.");

    const { user, token } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          passwordHash: "!invited",
          status: "PENDING_VERIFICATION",
        },
        select: { id: true, email: true, fullName: true },
      });
      await tx.userRole.create({
        data: {
          userId: created.id,
          roleId: role.id,
          grantedById: actor.userId,
        },
      });
      const raw = randomBytes(32).toString("base64url");
      await tx.accountActivationToken.create({
        data: {
          userId: created.id,
          tokenHash: this.hashToken(raw),
          expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 3_600_000),
        },
      });
      return { user: created, token: raw };
    });

    await this.audit.record({
      ...ctx,
      action: "user.invite",
      resourceType: "user",
      resourceId: user.id,
      after: { email: user.email, roleKey: input.roleKey },
    });

    this.sendInviteEmail(user.email!, user.fullName, role.name, token);

    return { id: user.id, email: user.email, fullName: user.fullName };
  }

  async resendInvite(actor: AuthUser, userId: string, ctx: AuditContext) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        status: "PENDING_VERIFICATION",
        roles: { some: { role: { key: { in: STAFF_ROLES } } } },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });
    if (!user || !user.email) {
      throw AppError.notFound("pending invite");
    }

    const raw = randomBytes(32).toString("base64url");
    await this.prisma.accountActivationToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(raw),
        expiresAt: new Date(Date.now() + INVITE_TTL_HOURS * 3_600_000),
      },
    });

    await this.audit.record({
      ...ctx,
      action: "user.invite.resend",
      resourceType: "user",
      resourceId: user.id,
    });

    this.sendInviteEmail(
      user.email,
      user.fullName,
      user.roles[0]?.role.name ?? "the team",
      raw,
    );

    return { resent: true };
  }

  async changeRole(
    actor: AuthUser,
    userId: string,
    input: ChangeUserRoleInput,
    ctx: AuditContext,
  ) {
    assertCanSetRole(actor.roles, input.roleKey);

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: { some: { role: { key: { in: STAFF_ROLES } } } },
      },
      select: {
        id: true,
        roles: { select: { id: true, role: { select: { key: true } } } },
      },
    });
    if (!user) throw AppError.notFound("staff user");

    const currentRoleKey = user.roles[0]?.role.key as RoleKey | undefined;
    assertCanModifySuperAdmin(
      actor.roles,
      currentRoleKey === RoleKey.SUPER_ADMIN,
    );

    const role = await this.prisma.role.findUnique({
      where: { key: input.roleKey },
    });
    if (!role) throw AppError.validation("Unknown role.");

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: user.id } }),
      this.prisma.userRole.create({
        data: { userId: user.id, roleId: role.id, grantedById: actor.userId },
      }),
    ]);

    await this.audit.record({
      ...ctx,
      action: "user.role.change",
      resourceType: "user",
      resourceId: user.id,
      before: { roleKey: currentRoleKey },
      after: { roleKey: input.roleKey },
    });

    return { id: user.id, roleKey: input.roleKey };
  }

  async changeStatus(
    actor: AuthUser,
    userId: string,
    input: ChangeUserStatusInput,
    ctx: AuditContext,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: { some: { role: { key: { in: STAFF_ROLES } } } },
      },
      select: {
        id: true,
        status: true,
        roles: { select: { role: { select: { key: true } } } },
      },
    });
    if (!user) throw AppError.notFound("staff user");

    const isSuperAdmin = user.roles.some((r) => r.role.key === "SUPER_ADMIN");
    assertCanModifySuperAdmin(actor.roles, isSuperAdmin);
    if (user.id === actor.userId && input.status !== "ACTIVE") {
      throw AppError.validation(
        "You cannot suspend or disable your own account.",
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { status: input.status },
      }),
      ...(input.status !== "ACTIVE"
        ? [
            this.prisma.session.updateMany({
              where: { userId: user.id, revokedAt: null },
              data: { revokedAt: new Date() },
            }),
          ]
        : []),
    ]);

    await this.audit.record({
      ...ctx,
      action: "user.status.change",
      resourceType: "user",
      resourceId: user.id,
      before: { status: user.status },
      after: { status: input.status },
    });

    return { id: user.id, status: input.status };
  }

  async acceptInvite(input: AcceptInviteInput, ctx: AuditContext) {
    const tokenHash = this.hashToken(input.token);
    const record = await this.prisma.accountActivationToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.validation(
        "This invitation link is invalid or has expired.",
      );
    }

    const passwordHash = await this.passwords.hash(input.password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { status: "ACTIVE", passwordHash, emailVerifiedAt: new Date() },
      }),
      this.prisma.accountActivationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      ...ctx,
      action: "user.invite.accept",
      resourceType: "user",
      resourceId: record.userId,
    });

    return { activated: true };
  }

  /** Best-effort — the account is already created; email failure is logged, not fatal. */
  private sendInviteEmail(
    to: string,
    fullName: string,
    roleLabel: string,
    token: string,
  ): void {
    const inviteUrl = `${this.config.urls.app}/accept-invite?token=${token}`;
    const template = staffInviteEmail({
      fullName,
      roleLabel,
      inviteUrl,
      expiresInHours: INVITE_TTL_HOURS,
    });
    this.email
      .send({
        to,
        subject: template.subject,
        body: template.text,
        html: template.html,
      })
      .catch((err: unknown) =>
        this.logger.warn(`Invite email to ${to} failed: ${String(err)}`),
      );
  }
}
