import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import {
  IMPORT_ROW_SCHEMAS,
  type CreateImportInput,
  type ImportEntity,
} from "@nexahaus/validation";
import type { AuthUser } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../../common/app-error";
import { RefService } from "../../common/ref.service";
import { AuditService, type AuditContext } from "../../audit/audit.service";
import { parseCsv, toCsv } from "../../common/csv";

export interface RowError {
  row: number;
  field?: string;
  message: string;
}

/**
 * Two-phase CSV / row import (spec §105): create validates every row and stores
 * the result; commit inserts the valid rows in a transaction and records the
 * outcome per row. Nothing is written until commit, and an import with any
 * validation error must be committed with `allowPartial` explicitly.
 */
@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refs: RefService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, input: CreateImportInput, ctx: AuditContext) {
    const rawRows: Record<string, unknown>[] = input.csv
      ? parseCsv(input.csv)
      : (input.rows ?? []);
    if (rawRows.length === 0) throw AppError.validation("No rows to import.");
    if (rawRows.length > 20_000) throw AppError.validation("Too many rows (max 20,000).");

    const schema = IMPORT_ROW_SCHEMAS[input.entity as ImportEntity];
    const errors: RowError[] = [];
    const valid: Record<string, unknown>[] = [];

    rawRows.forEach((raw, idx) => {
      const parsed = schema.safeParse(raw);
      if (parsed.success) {
        valid.push(parsed.data);
      } else {
        for (const issue of (parsed.error as ZodError).issues) {
          errors.push({
            row: idx + 2, // 1-based + header row
            field: issue.path.join(".") || undefined,
            message: issue.message,
          });
        }
      }
    });

    const ref = await this.refs.next("import");
    const job = await this.prisma.importJob.create({
      data: {
        ref,
        entity: input.entity as never,
        status: "VALIDATED",
        totalRows: rawRows.length,
        validRows: valid.length,
        errorRows: rawRows.length - valid.length,
        errors: errors as unknown as Prisma.InputJsonValue,
        result: { validRows: valid } as unknown as Prisma.InputJsonValue,
        createdById: user.userId,
      },
    });

    await this.audit.record({
      ...ctx,
      action: "import.validate",
      resourceType: "import_job",
      resourceId: job.id,
      after: { entity: input.entity, total: rawRows.length, valid: valid.length, errors: errors.length },
    });

    return this.serialize(job.id);
  }

  async commit(
    user: AuthUser,
    id: string,
    allowPartial: boolean,
    ctx: AuditContext,
  ) {
    const job = await this.prisma.importJob.findUnique({ where: { id } });
    if (!job) throw AppError.notFound("import");
    if (job.status !== "VALIDATED") {
      throw AppError.illegalTransition(`A ${job.status} import cannot be committed.`);
    }
    if (job.errorRows > 0 && !allowPartial) {
      throw AppError.conflict(
        `This import has ${job.errorRows} invalid row(s). Fix them or commit with allowPartial=true.`,
      );
    }

    const rows = ((job.result as { validRows?: Record<string, unknown>[] } | null)?.validRows ?? []);
    const created: string[] = [];
    const failures: RowError[] = [];

    await this.prisma.importJob.update({ where: { id }, data: { status: "COMMITTING" } });

    for (let i = 0; i < rows.length; i += 1) {
      try {
        const refOrId = await this.insertRow(job.entity as ImportEntity, rows[i]!, user);
        created.push(refOrId);
      } catch (err) {
        failures.push({
          row: i + 2,
          message: err instanceof Error ? err.message.slice(0, 300) : "insert failed",
        });
      }
    }

    const status =
      failures.length === 0
        ? "COMPLETED"
        : created.length > 0
          ? "PARTIALLY_COMPLETED"
          : "FAILED";

    await this.prisma.importJob.update({
      where: { id },
      data: {
        status: status as never,
        committedAt: new Date(),
        result: {
          validRows: [],
          createdRefs: created,
          commitFailures: failures,
        } as unknown as Prisma.InputJsonValue,
      },
    });
    await this.audit.record({
      ...ctx,
      action: "import.commit",
      resourceType: "import_job",
      resourceId: id,
      after: { status, created: created.length, failed: failures.length },
    });

    return this.serialize(id);
  }

  async list() {
    const rows = await this.prisma.importJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, ref: true, entity: true, status: true,
        totalRows: true, validRows: true, errorRows: true, createdAt: true, committedAt: true,
      },
    });
    return {
      __list: true as const,
      items: rows.map((r) => ({
        id: r.id,
        ref: r.ref,
        entity: r.entity,
        status: r.status,
        totalRows: r.totalRows,
        validRows: r.validRows,
        errorRows: r.errorRows,
        createdAt: r.createdAt.toISOString(),
        committedAt: r.committedAt?.toISOString() ?? null,
      })),
      meta: {},
    };
  }

  async errorsCsv(id: string): Promise<string> {
    const job = await this.prisma.importJob.findUnique({ where: { id } });
    if (!job) throw AppError.notFound("import");
    const validation = (job.errors as unknown as RowError[]) ?? [];
    const commit = ((job.result as { commitFailures?: RowError[] } | null)?.commitFailures) ?? [];
    return toCsv(
      ["phase", "row", "field", "message"],
      [
        ...validation.map((e) => ({ phase: "validation", ...e })),
        ...commit.map((e) => ({ phase: "commit", ...e })),
      ],
    );
  }

  private async serialize(id: string) {
    const job = await this.prisma.importJob.findUniqueOrThrow({ where: { id } });
    const result = job.result as {
      createdRefs?: string[];
      commitFailures?: RowError[];
    } | null;
    return {
      id: job.id,
      ref: job.ref,
      entity: job.entity,
      status: job.status,
      totalRows: job.totalRows,
      validRows: job.validRows,
      errorRows: job.errorRows,
      errors: (job.errors as unknown as RowError[]).slice(0, 200),
      createdRefs: result?.createdRefs ?? [],
      commitFailures: result?.commitFailures ?? [],
      createdAt: job.createdAt.toISOString(),
      committedAt: job.committedAt?.toISOString() ?? null,
    };
  }

  private async insertRow(
    entity: ImportEntity,
    row: Record<string, unknown>,
    user: AuthUser,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      switch (entity) {
        case "CLIENT": {
          const ref = await this.refs.next("client", tx);
          const c = await tx.client.create({
            data: {
              ref,
              type: (row.type as never) ?? "INDIVIDUAL",
              displayName: row.displayName as string,
              legalName: (row.legalName as string) || null,
              segment: (row.segment as never) ?? "OTHER",
              status: "PROSPECT",
              primaryEmail: (row.primaryEmail as string) || null,
              primaryPhone: (row.primaryPhone as string) || null,
              countryOfResidence: (row.countryOfResidence as string) || null,
              onboarding: { create: { currentStep: 1, status: "IN_PROGRESS" } },
            },
          });
          return c.ref;
        }
        case "PROPERTY": {
          const client = await tx.client.findFirst({
            where: { ref: row.clientRef as string, deletedAt: null },
            select: { id: true },
          });
          if (!client) throw new Error(`Client not found for ref ${String(row.clientRef)}`);
          const ref = await this.refs.next("property", tx);
          const p = await tx.property.create({
            data: {
              ref,
              clientId: client.id,
              name: row.name as string,
              type: row.type as never,
              status: "VACANT",
              addressLine: row.addressLine as string,
              city: row.city as string,
              region: row.region as string,
              country: (row.country as string) || "GH",
              bedrooms: (row.bedrooms as number) ?? null,
              bathrooms: (row.bathrooms as number) ?? null,
              estimatedValueMinor: row.estimatedValueMinor ? BigInt(row.estimatedValueMinor as string) : null,
              estimatedValueCurrency: (row.estimatedValueCurrency as string) || null,
              owners: { create: { clientId: client.id, sharePercent: 100, isPrimary: true } },
              onboardingChecklist: { create: { items: {}, completionPercent: 0, status: "IN_PROGRESS" } },
            },
          });
          return p.ref;
        }
        case "UNIT": {
          const property = await tx.property.findFirst({
            where: { ref: row.propertyRef as string, deletedAt: null },
            select: { id: true },
          });
          if (!property) throw new Error(`Property not found for ref ${String(row.propertyRef)}`);
          const ref = await this.refs.next("unit", tx);
          const u = await tx.unit.create({
            data: {
              propertyId: property.id,
              ref,
              label: row.label as string,
              bedrooms: (row.bedrooms as number) ?? null,
              bathrooms: (row.bathrooms as number) ?? null,
              marketRentMinor: row.marketRentMinor ? BigInt(row.marketRentMinor as string) : null,
              marketRentCurrency: (row.marketRentCurrency as string) || null,
              status: (row.status as never) ?? "VACANT",
            },
          });
          await tx.property.update({
            where: { id: property.id },
            data: { unitCount: { increment: 1 } },
          });
          return u.ref;
        }
        case "TENANT": {
          const ref = await this.refs.next("tenant", tx);
          const t = await tx.tenant.create({
            data: {
              ref,
              fullName: row.fullName as string,
              phone: row.phone as string,
              email: (row.email as string) || null,
              emergencyContactName: (row.emergencyContactName as string) || null,
              emergencyContactPhone: (row.emergencyContactPhone as string) || null,
              status: (row.status as never) ?? "ACTIVE",
            },
          });
          return t.ref;
        }
        default:
          throw new Error(`Unsupported import entity ${entity}`);
      }
    });
  }
}
