/**
 * Payment webhook (e2e, spec §81): a valid HMAC-signed event creates exactly one
 * Payment + Transaction + allocation; a duplicate delivery of the same
 * providerEventId is a 200 no-op that creates nothing more; an invalid signature
 * is rejected and writes nothing. Also checks the §81 allocation cases end to end.
 *
 * Requires PAYMENT_PROVIDER=generic + PAYMENT_WEBHOOK_SECRET (see .env.test) and a
 * migrated disposable DATABASE_URL. Run: pnpm --filter @nexahaus/api test:e2e
 */
import { createHmac } from "node:crypto";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/http-exception.filter";
import { ResponseInterceptor } from "../src/common/response.interceptor";

const prisma = new PrismaClient();
const SECRET =
  process.env.PAYMENT_WEBHOOK_SECRET ??
  "test-webhook-secret-0123456789abcdef0123";
const stamp = Date.now();

function sign(body: string): string {
  return (
    "sha256=" +
    createHmac("sha256", SECRET).update(Buffer.from(body)).digest("hex")
  );
}

describe("Payment webhook (e2e)", () => {
  let app: INestApplication;
  let leaseRef: string;
  let leaseId: string;
  let propertyId: string;
  let clientId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const client = await prisma.client.create({
      data: {
        ref: `CL-WH-${stamp}`,
        type: "INDIVIDUAL",
        displayName: "WH Client",
        status: "ACTIVE",
      },
    });
    clientId = client.id;
    const property = await prisma.property.create({
      data: {
        ref: `NH-WH-${stamp}`,
        clientId,
        name: "WH House",
        type: "HOUSE",
        status: "OCCUPIED",
        addressLine: "4 Test Road",
        city: "Accra",
        region: "Greater Accra",
        unitCount: 1,
      },
    });
    propertyId = property.id;
    const unit = await prisma.unit.create({
      data: {
        propertyId,
        ref: `NHU-WH-${stamp}`,
        label: "Whole",
        status: "OCCUPIED",
      },
    });
    const tenant = await prisma.tenant.create({
      data: {
        ref: `TN-WH-${stamp}`,
        fullName: "WH Tenant",
        phone: "+233209990001",
        status: "ACTIVE",
      },
    });
    leaseRef = `LS-WH${String(stamp).slice(-4)}`;
    const lease = await prisma.lease.create({
      data: {
        ref: leaseRef,
        propertyId,
        unitId: unit.id,
        clientId,
        startDate: new Date("2027-01-01"),
        endDate: new Date("2027-04-01"),
        rentMinor: 800_000n,
        rentCurrency: "GHS",
        frequency: "MONTHLY",
        status: "ACTIVE",
        parties: { create: { tenantId: tenant.id, isPrimary: true } },
      },
    });
    leaseId = lease.id;
    for (const m of [0, 1, 2]) {
      const start = new Date(Date.UTC(2027, m, 1));
      await prisma.rentCharge.create({
        data: {
          leaseId,
          propertyId,
          unitId: unit.id,
          clientId,
          periodStart: start,
          periodEnd: new Date(Date.UTC(2027, m + 1, 1)),
          dueDate: start,
          amountMinor: 800_000n,
          currency: "GHS",
          status: "EXPECTED",
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.paymentAllocation.deleteMany({
      where: { payment: { propertyId } },
    });
    await prisma.payment.deleteMany({ where: { propertyId } });
    await prisma.transaction.deleteMany({ where: { propertyId } });
    await prisma.paymentProviderWebhookEvent.deleteMany({
      where: { providerEventId: { startsWith: `evt-${stamp}` } },
    });
    await prisma.rentCharge.deleteMany({ where: { propertyId } });
    await prisma.leaseParty.deleteMany({ where: { lease: { propertyId } } });
    await prisma.lease.deleteMany({ where: { propertyId } });
    await prisma.tenant.deleteMany({ where: { ref: `TN-WH-${stamp}` } });
    await prisma.unit.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.$disconnect();
    await app.close();
  });

  const post = (body: string, signature: string | null) => {
    const req = request(app.getHttpServer())
      .post("/api/v1/payments/webhook")
      .set("content-type", "application/json");
    if (signature) req.set("x-signature", signature);
    return req.send(body);
  };

  it("rejects an invalid signature and writes nothing", async () => {
    const body = JSON.stringify({
      event_id: `evt-${stamp}-bad`,
      reference: `MOMO-${stamp}-1`,
      amount_minor: 800000,
      currency: "GHS",
      status: "SUCCESS",
      lease_ref: leaseRef,
    });
    await post(body, "sha256=deadbeef").expect(400);
    const count = await prisma.payment.count({ where: { propertyId } });
    expect(count).toBe(0);
  });

  it("processes a valid event → one Payment, one Transaction, oldest charge PAID", async () => {
    const body = JSON.stringify({
      event_id: `evt-${stamp}-1`,
      reference: `MOMO-${stamp}-1`,
      amount_minor: 800000,
      currency: "GHS",
      status: "SUCCESS",
      channel: "MOBILE_MONEY",
      lease_ref: leaseRef,
    });
    const res = await post(body, sign(body)).expect(200);
    expect(res.body.data.status).toBe("processed");

    const payments = await prisma.payment.findMany({ where: { propertyId } });
    expect(payments).toHaveLength(1);
    const txns = await prisma.transaction.findMany({
      where: { propertyId, type: "RENT_PAYMENT" },
    });
    expect(txns).toHaveLength(1);
    const charges = await prisma.rentCharge.findMany({
      where: { leaseId },
      orderBy: { periodStart: "asc" },
    });
    expect(charges[0]!.status).toBe("PAID");
    expect(charges[1]!.status).toBe("EXPECTED");
  });

  it("a duplicate delivery of the same event id is a 200 no-op", async () => {
    const body = JSON.stringify({
      event_id: `evt-${stamp}-1`,
      reference: `MOMO-${stamp}-1`,
      amount_minor: 800000,
      currency: "GHS",
      status: "SUCCESS",
      channel: "MOBILE_MONEY",
      lease_ref: leaseRef,
    });
    const res = await post(body, sign(body)).expect(200);
    expect(res.body.data.status).toBe("replayed");

    expect(await prisma.payment.count({ where: { propertyId } })).toBe(1);
    expect(
      await prisma.transaction.count({
        where: { propertyId, type: "RENT_PAYMENT" },
      }),
    ).toBe(1);
  });

  it("a partial payment on a fresh event → PARTIALLY_PAID + 3,000 outstanding (spec §81)", async () => {
    const body = JSON.stringify({
      event_id: `evt-${stamp}-2`,
      reference: `MOMO-${stamp}-2`,
      amount_minor: 500000,
      currency: "GHS",
      status: "SUCCESS",
      channel: "MOBILE_MONEY",
      lease_ref: leaseRef,
    });
    await post(body, sign(body)).expect(200);
    const charges = await prisma.rentCharge.findMany({
      where: { leaseId },
      orderBy: { periodStart: "asc" },
    });
    // charge[0] already PAID; charge[1] now 500,000 of 800,000
    expect(charges[1]!.status).toBe("PARTIALLY_PAID");
    expect((charges[1]!.amountMinor - charges[1]!.paidMinor).toString()).toBe(
      "300000",
    );
  });
});
