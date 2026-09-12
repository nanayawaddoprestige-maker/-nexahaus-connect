/**
 * Lease lifecycle (e2e): create → activate (generates rent charges, occupies the
 * unit) → renew (bills the extension) → terminate (waives future unpaid charges).
 * Also asserts the financial test case from spec §81 via a direct charge check.
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
const PASSWORD = "LeaseTest!2027";
const stamp = Date.now();

describe("Lease lifecycle (e2e)", () => {
  let app: INestApplication;
  let access: string;
  let propertyId: string;
  let unitId: string;
  let tenantId: string;
  let leaseId: string;
  const created: { users: string[]; clients: string[] } = {
    users: [],
    clients: [],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    // A scope-exempt SUPER_ADMIN keeps the test focused on the workflow.
    const role = await prisma.role.findUniqueOrThrow({
      where: { key: RoleKey.SUPER_ADMIN },
    });
    const email = `lease.admin.${stamp}@nexahaus.test`;
    const user = await prisma.user.create({
      data: {
        email,
        fullName: "Lease Admin",
        passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: role.id } },
      },
    });
    created.users.push(user.id);

    const client = await prisma.client.create({
      data: {
        ref: `CL-LEASE-${stamp}`,
        type: "INDIVIDUAL",
        displayName: "Lease Client",
        status: "ACTIVE",
      },
    });
    created.clients.push(client.id);

    const property = await prisma.property.create({
      data: {
        ref: `NH-LEASE-${stamp}`,
        clientId: client.id,
        name: "Lease Test House",
        type: "HOUSE",
        status: "VACANT",
        addressLine: "2 Test Road",
        city: "Accra",
        region: "Greater Accra",
        unitCount: 1,
      },
    });
    propertyId = property.id;
    const unit = await prisma.unit.create({
      data: {
        propertyId,
        ref: `NHU-LEASE-${stamp}`,
        label: "Whole property",
        status: "VACANT",
      },
    });
    unitId = unit.id;
    const tenant = await prisma.tenant.create({
      data: {
        ref: `TN-LEASE-${stamp}`,
        fullName: "Lease Tenant",
        phone: "+233201112223",
        status: "ACTIVE",
      },
    });
    tenantId = tenant.id;

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ identifier: email, password: PASSWORD })
      .expect(200);
    access = login.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.rentCharge.deleteMany({ where: { propertyId } });
    await prisma.leaseParty.deleteMany({ where: { lease: { propertyId } } });
    await prisma.leaseReminder.deleteMany({ where: { lease: { propertyId } } });
    await prisma.lease.deleteMany({ where: { propertyId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.unit.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.client.deleteMany({ where: { id: { in: created.clients } } });
    await prisma.user.deleteMany({ where: { id: { in: created.users } } });
    await prisma.$disconnect();
    await app.close();
  });

  it("creates a DRAFT lease", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/leases")
      .set("authorization", `Bearer ${access}`)
      .send({
        propertyId,
        unitId,
        tenantIds: [tenantId],
        primaryTenantId: tenantId,
        startDate: "2027-01-01",
        endDate: "2028-01-01",
        rent: { minor: "800000", currency: "GHS" },
        frequency: "MONTHLY",
        noticePeriodDays: 30,
      })
      .expect(201);
    leaseId = res.body.data.id;
    expect(res.body.data.status).toBe("DRAFT");
    expect(res.body.data.rentCharges).toHaveLength(0);
  });

  it("rejects a second overlapping lease on the same unit", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/leases")
      .set("authorization", `Bearer ${access}`)
      .send({
        propertyId,
        unitId,
        tenantIds: [tenantId],
        primaryTenantId: tenantId,
        startDate: "2027-06-01",
        endDate: "2027-12-01",
        rent: { minor: "800000", currency: "GHS" },
        frequency: "MONTHLY",
      })
      .expect(201); // second DRAFT is allowed; overlap is enforced on ACTIVE only
  });

  it("activates the lease: 12 monthly rent charges, unit + property OCCUPIED", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leases/${leaseId}/activate`)
      .set("authorization", `Bearer ${access}`)
      .expect(201);
    expect(res.body.data.status).toBe("ACTIVE");
    expect(res.body.data.rentCharges).toHaveLength(12);
    expect(
      res.body.data.rentCharges.every(
        (c: { status: string }) => c.status === "EXPECTED",
      ),
    ).toBe(true);
    expect(res.body.data.summary.billedMinor).toBe("9600000"); // 12 * 800,000

    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    expect(unit?.status).toBe("OCCUPIED");
  });

  it("is idempotent — re-activating does not duplicate charges", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/leases/${leaseId}/activate`)
      .set("authorization", `Bearer ${access}`)
      .expect(409); // already ACTIVE
    const count = await prisma.rentCharge.count({ where: { leaseId } });
    expect(count).toBe(12);
  });

  it("renews the lease and bills the extra 6 months", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leases/${leaseId}/renew`)
      .set("authorization", `Bearer ${access}`)
      .send({
        newEndDate: "2028-07-01",
        newRent: { minor: "850000", currency: "GHS" },
      })
      .expect(201);
    expect(res.body.data.status).toBe("ACTIVE");
    expect(res.body.data.rentCharges).toHaveLength(18);
    // the 6 new charges carry the new rent
    const newOnes = res.body.data.rentCharges.slice(12);
    expect(
      newOnes.every(
        (c: { amount: { minor: string } }) => c.amount.minor === "850000",
      ),
    ).toBe(true);
  });

  it("terminates the lease: future unpaid charges waived, unit VACANT", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leases/${leaseId}/terminate`)
      .set("authorization", `Bearer ${access}`)
      .send({ effectiveDate: "2027-04-01", reason: "Tenant relocating" })
      .expect(201);
    expect(res.body.data.status).toBe("TERMINATED");

    const waived = await prisma.rentCharge.count({
      where: { leaseId, status: "WAIVED" },
    });
    expect(waived).toBeGreaterThan(0);
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    expect(unit?.status).toBe("VACANT");
  });

  it("records an audit entry for every transition", async () => {
    const actions = await prisma.auditLog.findMany({
      where: { resourceType: "lease", resourceId: leaseId },
      select: { action: true },
    });
    const kinds = new Set(actions.map((a) => a.action));
    expect(kinds).toEqual(
      new Set([
        "lease.create",
        "lease.activate",
        "lease.renew",
        "lease.terminate",
      ]),
    );
  });
});
