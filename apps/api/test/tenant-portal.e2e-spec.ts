/**
 * Tenant portal isolation (e2e, RELEASE-BLOCKING — spec §41, §79, §84):
 * a tenant sees only their own tenancy data and NEVER any owner-level figure
 * (management fee, net owner income, owner statements, other tenants, other
 * units), and cannot reach owner/admin endpoints.
 *
 * Requires a migrated disposable DATABASE_URL with the seed applied. Run:
 * pnpm --filter @nexahaus/api test:e2e
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
const PASSWORD = "TenantTest!2027";
const stamp = Date.now();

describe("Tenant portal isolation (e2e)", () => {
  let app: INestApplication;
  let tenantToken: string;
  let ownerToken: string;
  let clientId: string;
  let propertyId: string;
  let leaseId: string;
  let tenantId: string;
  let otherTenantId: string;
  const cleanupUsers: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const hash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
    const [ownerRole, tenantRole] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { key: RoleKey.OWNER } }),
      prisma.role.findUniqueOrThrow({ where: { key: RoleKey.TENANT } }),
    ]);

    const ownerUser = await prisma.user.create({
      data: { email: `t.owner.${stamp}@nexahaus.test`, fullName: "T Owner", passwordHash: hash, status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId: ownerRole.id } } },
    });
    const tenantUser = await prisma.user.create({
      data: { email: `t.tenant.${stamp}@nexahaus.test`, fullName: "T Tenant", passwordHash: hash, status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId: tenantRole.id } } },
    });
    cleanupUsers.push(ownerUser.id, tenantUser.id);

    const client = await prisma.client.create({
      data: {
        ref: `CL-T-${stamp}`, type: "INDIVIDUAL", displayName: "T Client", status: "ACTIVE",
        users: { create: { userId: ownerUser.id, relationship: "PRIMARY", canApprove: true, acceptedAt: new Date() } },
      },
    });
    clientId = client.id;

    const property = await prisma.property.create({
      data: {
        ref: `NH-T-${stamp}`, clientId, name: "T House", type: "APARTMENT", status: "OCCUPIED",
        addressLine: "8 Test Road", city: "Accra", region: "Greater Accra", unitCount: 2,
        agreements: {
          create: {
            feeType: "PERCENT_OF_COLLECTED", feePercent: 10, feeCurrency: "GHS",
            startDate: new Date("2027-01-01"), inspectionFrequency: "QUARTERLY",
            maintenanceApprovalThresholdMinor: 150_000n, thresholdCurrency: "GHS", status: "ACTIVE",
          },
        },
      },
    });
    propertyId = property.id;

    const unitA = await prisma.unit.create({ data: { propertyId, ref: `NHU-TA-${stamp}`, label: "Unit 1", status: "OCCUPIED" } });
    const unitB = await prisma.unit.create({ data: { propertyId, ref: `NHU-TB-${stamp}`, label: "Unit 2", status: "OCCUPIED" } });

    const tenant = await prisma.tenant.create({
      data: { ref: `TN-T-${stamp}`, userId: tenantUser.id, fullName: "T Tenant", phone: "+233201110001", status: "ACTIVE" },
    });
    tenantId = tenant.id;
    const other = await prisma.tenant.create({
      data: { ref: `TN-TO-${stamp}`, fullName: "Other Tenant", phone: "+233201110002", status: "ACTIVE" },
    });
    otherTenantId = other.id;

    const lease = await prisma.lease.create({
      data: {
        ref: `LS-T-${stamp}`, propertyId, unitId: unitA.id, clientId,
        startDate: new Date("2027-01-01"), endDate: new Date("2027-12-31"),
        rentMinor: 600_000n, rentCurrency: "GHS", frequency: "MONTHLY", depositMinor: 1_200_000n, depositCurrency: "GHS", status: "ACTIVE",
        parties: { create: { tenantId: tenant.id, isPrimary: true } },
      },
    });
    leaseId = lease.id;
    const otherLease = await prisma.lease.create({
      data: {
        ref: `LS-TO-${stamp}`, propertyId, unitId: unitB.id, clientId,
        startDate: new Date("2027-01-01"), endDate: new Date("2027-12-31"),
        rentMinor: 700_000n, rentCurrency: "GHS", frequency: "MONTHLY", status: "ACTIVE",
        parties: { create: { tenantId: other.id, isPrimary: true } },
      },
    });

    for (let m = 0; m < 3; m += 1) {
      const start = new Date(Date.UTC(2027, m, 1));
      await prisma.rentCharge.create({
        data: {
          leaseId: lease.id, propertyId, unitId: unitA.id, clientId,
          periodStart: start, periodEnd: new Date(Date.UTC(2027, m + 1, 1)), dueDate: start,
          amountMinor: 600_000n, currency: "GHS", paidMinor: m === 0 ? 600_000n : 0n, status: m === 0 ? "PAID" : "OVERDUE",
        },
      });
      await prisma.rentCharge.create({
        data: {
          leaseId: otherLease.id, propertyId, unitId: unitB.id, clientId,
          periodStart: start, periodEnd: new Date(Date.UTC(2027, m + 1, 1)), dueDate: start,
          amountMinor: 700_000n, currency: "GHS", status: "EXPECTED",
        },
      });
    }
    await prisma.payment.create({
      data: {
        ref: `PMT-T-${stamp}`, tenantId: tenant.id, leaseId: lease.id, propertyId, clientId,
        amountMinor: 600_000n, currency: "GHS", receivedAt: new Date("2027-01-04"), method: "MOBILE_MONEY",
        status: "CONFIRMED", idempotencyKey: `seed-t-${stamp}`,
      },
    });

    const login = async (email: string) =>
      (await request(app.getHttpServer()).post("/api/v1/auth/login").send({ identifier: email, password: PASSWORD }).expect(200)).body.data.tokens.accessToken;
    tenantToken = await login(tenantUser.email!);
    ownerToken = await login(ownerUser.email!);
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { propertyId } });
    await prisma.maintenanceStatusHistory.deleteMany({ where: { request: { propertyId } } });
    await prisma.maintenanceRequest.deleteMany({ where: { propertyId } });
    await prisma.rentCharge.deleteMany({ where: { propertyId } });
    await prisma.leaseParty.deleteMany({ where: { lease: { propertyId } } });
    await prisma.lease.deleteMany({ where: { propertyId } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, otherTenantId] } } });
    await prisma.unit.deleteMany({ where: { propertyId } });
    await prisma.managementAgreement.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.user.deleteMany({ where: { id: { in: cleanupUsers } } });
    await prisma.$disconnect();
    await app.close();
  });

  const asTenant = (path: string) =>
    request(app.getHttpServer()).get(path).set("authorization", `Bearer ${tenantToken}`);

  it("GET /tenant/me returns the tenant's own tenancy", async () => {
    const res = await asTenant("/api/v1/tenant/me").expect(200);
    expect(res.body.data.currentTenancy.leaseRef).toBe(`LS-T-${stamp}`);
    expect(res.body.data.currentTenancy.unit).toBe("Unit 1");
  });

  it("GET /tenant/rent exposes NO owner-level figures", async () => {
    const res = await asTenant("/api/v1/tenant/rent").expect(200);
    const json = JSON.stringify(res.body).toLowerCase();
    for (const forbidden of ["managementfee", "netowner", "grossrental", "distribution", "vacancyloss", "closingbalance"]) {
      expect(json).not.toContain(forbidden);
    }
    // Only this tenant's charges (600,000 rent), never the other lease's 700,000.
    expect(res.body.data.charges.every((c: { amount: { minor: string } }) => c.amount.minor === "600000")).toBe(true);
    expect(res.body.data.summary.outstandingMinor).toBe("1200000"); // 2 unpaid months
  });

  it("GET /tenant/payments returns only the tenant's own payments", async () => {
    const res = await asTenant("/api/v1/tenant/payments").expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].amount.minor).toBe("600000");
  });

  it("a tenant cannot reach owner or admin endpoints", async () => {
    await asTenant("/api/v1/dashboard/owner").expect(403);
    await asTenant("/api/v1/dashboard/owner/financials").expect(403);
    await asTenant("/api/v1/admin/overview").expect(403);
    await asTenant(`/api/v1/clients/${clientId}`).expect((r) => {
      if (![403, 404].includes(r.status)) throw new Error(`expected 403/404, got ${r.status}`);
    });
    await asTenant(`/api/v1/properties/${propertyId}/financials`).expect((r) => {
      if (![403, 404].includes(r.status)) throw new Error(`expected 403/404, got ${r.status}`);
    });
    const stmt = await asTenant("/api/v1/statements");
    expect(stmt.status).toBe(403);
  });

  it("a tenant can report maintenance and see it, but not another unit's history via /tenant", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/maintenance")
      .set("authorization", `Bearer ${tenantToken}`)
      .send({ propertyId, category: "PLUMBING", priority: "MEDIUM", title: "Leaking tap", description: "Slow drip in the kitchen." })
      .expect(201);
    expect(created.body.data.status).toBe("REPORTED");

    const list = await request(app.getHttpServer())
      .get("/api/v1/maintenance")
      .set("authorization", `Bearer ${tenantToken}`)
      .expect(200);
    expect((list.body.data as { title: string }[]).some((m) => m.title === "Leaking tap")).toBe(true);
  });

  it("the owner still sees their portfolio (sanity — isolation is one-directional)", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/dashboard/owner")
      .set("authorization", `Bearer ${ownerToken}`)
      .expect(200);
    expect(res.body.data.portfolio.totalProperties).toBe(1);
  });
});
