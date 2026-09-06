/**
 * Owner statement reproducibility (spec §18, §97): a statement's totals are a
 * pure function of the transaction ledger. Generating the same client + period
 * twice returns the identical statement; closing = opening + Σcredits − Σdebits;
 * net = gross − fees − maintenance − other. No endpoint mutates a total.
 *
 * Requires a migrated disposable DATABASE_URL. Run: pnpm --filter @nexahaus/api test:e2e
 */
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { RoleKey } from "@nexahaus/types";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/http-exception.filter";
import { ResponseInterceptor } from "../src/common/response.interceptor";

const prisma = new PrismaClient();
const PASSWORD = "StmtTest!2027";
const stamp = Date.now();

describe("Statement reproducibility (e2e)", () => {
  let app: INestApplication;
  let access: string;
  let clientId: string;
  let propertyId: string;
  const cleanupUsers: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const role = await prisma.role.findUniqueOrThrow({ where: { key: RoleKey.SUPER_ADMIN } });
    const email = `stmt.admin.${stamp}@nexahaus.test`;
    const user = await prisma.user.create({
      data: {
        email,
        fullName: "Stmt Admin",
        passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: role.id } },
      },
    });
    cleanupUsers.push(user.id);

    const client = await prisma.client.create({
      data: { ref: `CL-STMT-${stamp}`, type: "INDIVIDUAL", displayName: "Stmt Client", status: "ACTIVE" },
    });
    clientId = client.id;
    const property = await prisma.property.create({
      data: {
        ref: `NH-STMT-${stamp}`,
        clientId,
        name: "Stmt House",
        type: "HOUSE",
        status: "OCCUPIED",
        addressLine: "5 Test Road",
        city: "Accra",
        region: "Greater Accra",
        unitCount: 1,
        agreements: {
          create: {
            feeType: "PERCENT_OF_COLLECTED",
            feePercent: 10,
            feeCurrency: "GHS",
            startDate: new Date("2027-01-01"),
            inspectionFrequency: "QUARTERLY",
            maintenanceApprovalThresholdMinor: 150_000n,
            thresholdCurrency: "GHS",
            status: "ACTIVE",
          },
        },
      },
    });
    propertyId = property.id;

    // Ledger for March 2027: rent 800,000 in, plumbing expense 45,000 out,
    // and a prior-period rent 800,000 (opening balance contributor).
    const mk = (
      type: string,
      amountMinor: bigint,
      occurredAt: string,
      category: string | null,
    ) =>
      prisma.transaction.create({
        data: {
          ref: `TXN-STMT-${stamp}-${Math.random().toString(36).slice(2, 8)}`,
          type: type as never,
          amountMinor,
          currency: "GHS",
          occurredAt: new Date(occurredAt),
          propertyId,
          clientId,
          category,
          method: "NONE",
          status: "POSTED",
        },
      });

    await mk("RENT_PAYMENT", 800_000n, "2027-02-03T00:00:00Z", "RENT"); // before period
    await mk("RENT_PAYMENT", 800_000n, "2027-03-04T00:00:00Z", "RENT");
    await mk("EXPENSE", -45_000n, "2027-03-15T00:00:00Z", "PLUMBING");

    // A rent charge in-period so the fee calc has an "expected" figure.
    await prisma.rentCharge.create({
      data: {
        leaseId: (
          await prisma.lease.create({
            data: {
              ref: `LS-STMT-${stamp}`,
              propertyId,
              unitId: (
                await prisma.unit.create({
                  data: { propertyId, ref: `NHU-STMT-${stamp}`, label: "Whole", status: "OCCUPIED" },
                })
              ).id,
              clientId,
              startDate: new Date("2027-01-01"),
              endDate: new Date("2027-12-31"),
              rentMinor: 800_000n,
              rentCurrency: "GHS",
              frequency: "MONTHLY",
              status: "ACTIVE",
            },
          })
        ).id,
        propertyId,
        unitId: (await prisma.unit.findFirstOrThrow({ where: { propertyId } })).id,
        clientId,
        periodStart: new Date("2027-03-01"),
        periodEnd: new Date("2027-04-01"),
        dueDate: new Date("2027-03-01"),
        amountMinor: 800_000n,
        currency: "GHS",
        paidMinor: 800_000n,
        status: "PAID",
      },
    });

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ identifier: email, password: PASSWORD })
      .expect(200);
    access = login.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.statementLine.deleteMany({ where: { statement: { clientId } } });
    await prisma.statement.deleteMany({ where: { clientId } });
    await prisma.document.deleteMany({ where: { scopeType: "STATEMENT" } });
    await prisma.transaction.deleteMany({ where: { clientId } });
    await prisma.rentCharge.deleteMany({ where: { propertyId } });
    await prisma.lease.deleteMany({ where: { propertyId } });
    await prisma.unit.deleteMany({ where: { propertyId } });
    await prisma.managementAgreement.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.user.deleteMany({ where: { id: { in: cleanupUsers } } });
    await prisma.$disconnect();
    await app.close();
  });

  const generate = () =>
    request(app.getHttpServer())
      .post("/api/v1/statements/generate")
      .set("authorization", `Bearer ${access}`)
      .send({
        clientId,
        propertyId,
        periodStart: "2027-03-01",
        periodEnd: "2027-04-01",
        idempotencyKey: `stmt:${clientId}:${propertyId}:2027-03-01`,
      });

  let first: Record<string, unknown>;

  it("generates a statement whose totals reconcile", async () => {
    const res = await generate().expect(201);
    first = res.body.data;

    const opening = BigInt(first.openingBalanceMinor as string);
    const gross = BigInt(first.grossRentalIncomeMinor as string);
    const fees = BigInt(first.managementFeesMinor as string);
    const maint = BigInt(first.maintenanceExpensesMinor as string);
    const other = BigInt(first.otherExpensesMinor as string);
    const net = BigInt(first.netAmountMinor as string);
    const closing = BigInt(first.closingBalanceMinor as string);

    // opening = the single pre-period rent payment
    expect(opening).toBe(800_000n);
    // gross rent in-period = 800,000; fee = 10% of collected (800,000) = 80,000
    expect(gross).toBe(800_000n);
    expect(fees).toBe(80_000n);
    // plumbing 45,000 is a maintenance category
    expect(maint).toBe(45_000n);
    expect(other).toBe(0n);
    // net = gross − fees − maintenance − other
    expect(net).toBe(gross - fees - maint - other);
    // closing = opening + (credits − debits) in period
    //         = 800,000 + (800,000 − 80,000 − 45,000)
    expect(closing).toBe(opening + gross - fees - maint - other);

    const lines = first.lines as { direction: string; amountMinor: string }[];
    const credits = lines
      .filter((l) => l.direction === "CREDIT")
      .reduce((s, l) => s + BigInt(l.amountMinor), 0n);
    const debits = lines
      .filter((l) => l.direction === "DEBIT")
      .reduce((s, l) => s + BigInt(l.amountMinor), 0n);
    expect(closing).toBe(opening + credits - debits);
  });

  it("re-generating the same client + period returns the identical statement", async () => {
    const res = await generate().expect(201);
    expect(res.body.data.id).toBe(first.id);
    expect(res.body.data.closingBalanceMinor).toBe(first.closingBalanceMinor);
    expect(res.body.data.netAmountMinor).toBe(first.netAmountMinor);
    expect(res.body.data.managementFeesMinor).toBe(first.managementFeesMinor);

    // And exactly one MANAGEMENT_FEE transaction was posted for the period.
    const feeTxns = await prisma.transaction.count({
      where: { propertyId, type: "MANAGEMENT_FEE" },
    });
    expect(feeTxns).toBe(1);
  });

  it("exposes no endpoint that edits a statement total", async () => {
    // PATCH is not routed for statements; issue only changes status.
    await request(app.getHttpServer())
      .patch(`/api/v1/statements/${first.id as string}`)
      .set("authorization", `Bearer ${access}`)
      .send({ netAmountMinor: "1" })
      .expect(404);
  });
});
