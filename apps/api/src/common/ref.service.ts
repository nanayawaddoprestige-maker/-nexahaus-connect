import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type RefKind =
  | "property"
  | "unit"
  | "client"
  | "lead"
  | "tenant"
  | "lease"
  | "payment"
  | "transaction"
  | "expense"
  | "maintenance"
  | "workorder"
  | "inspection"
  | "statement"
  | "distribution"
  | "approval"
  | "vendor"
  | "assessment"
  | "rescue";

const PREFIX: Record<RefKind, string> = {
  property: "NH",
  unit: "NHU",
  client: "CL",
  lead: "LD",
  tenant: "TN",
  lease: "LS",
  payment: "PMT",
  transaction: "TXN",
  expense: "EXP",
  maintenance: "MR",
  workorder: "WO",
  inspection: "INS",
  statement: "STMT",
  distribution: "DST",
  approval: "APR",
  vendor: "VN",
  assessment: "PA",
  rescue: "PR",
};

/**
 * Human-facing reference generator (e.g. `NH-000001`). Uses an upsert +
 * atomic increment on the `sequences` table so concurrent callers never collide.
 * Pass a transaction client to allocate the ref inside the same transaction as
 * the row it identifies.
 */
@Injectable()
export class RefService {
  constructor(private readonly prisma: PrismaService) {}

  async next(kind: RefKind, tx?: Prisma.TransactionClient): Promise<string> {
    const client = tx ?? this.prisma;
    const key = `ref:${kind}`;
    const row = await client.sequence.upsert({
      where: { key },
      create: { key, nextValue: 2n },
      update: { nextValue: { increment: 1n } },
      select: { nextValue: true },
    });
    // After create, nextValue is 2 and this call owns 1. After update, this call
    // owns (nextValue - 1).
    const owned = row.nextValue - 1n;
    return `${PREFIX[kind]}-${owned.toString().padStart(6, "0")}`;
  }
}
