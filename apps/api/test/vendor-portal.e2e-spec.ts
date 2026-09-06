/**
 * Vendor portal isolation (e2e, spec §44, §84): a vendor sees ONLY the work
 * orders assigned to them, can start and complete their own job (which drives
 * the maintenance request), and cannot reach another vendor's work or any
 * owner/admin endpoint.
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
const PASSWORD = "VendorTest!2027";
const stamp = Date.now();

describe("Vendor portal isolation (e2e)", () => {
  let app: INestApplication;
  let vendorToken: string;
  let propertyId: string;
  let clientId: string;
  let myWorkOrderId: string;
  let otherWorkOrderId: string;
  let requestId: string;
  const cleanupUsers: string[] = [];
  const cleanupVendors: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const hash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
    const vendorRole = await prisma.role.findUniqueOrThrow({ where: { key: RoleKey.VENDOR } });

    const vendorUser = await prisma.user.create({
      data: { email: `v.user.${stamp}@nexahaus.test`, fullName: "V Vendor", passwordHash: hash, status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId: vendorRole.id } } },
    });
    cleanupUsers.push(vendorUser.id);

    const myVendor = await prisma.vendor.create({
      data: { ref: `VN-V-${stamp}`, userId: vendorUser.id, name: "My Vendor", type: "COMPANY", categories: ["PLUMBING"], phone: "+233201230001", status: "ACTIVE" },
    });
    const otherVendor = await prisma.vendor.create({
      data: { ref: `VN-O-${stamp}`, name: "Other Vendor", type: "COMPANY", categories: ["PLUMBING"], phone: "+233201230002", status: "ACTIVE" },
    });
    cleanupVendors.push(myVendor.id, otherVendor.id);

    const client = await prisma.client.create({
      data: { ref: `CL-V-${stamp}`, type: "INDIVIDUAL", displayName: "V Client", status: "ACTIVE" },
    });
    clientId = client.id;
    const property = await prisma.property.create({
      data: {
        ref: `NH-V-${stamp}`, clientId, name: "V House", type: "HOUSE", status: "OCCUPIED",
        addressLine: "9 Test Road", city: "Accra", region: "Greater Accra", unitCount: 1,
      },
    });
    propertyId = property.id;

    const req = await prisma.maintenanceRequest.create({
      data: {
        ref: `MR-V-${stamp}`, propertyId, reportedByType: "STAFF", category: "PLUMBING", priority: "MEDIUM",
        title: "Leaking pipe", description: "Under the sink.", status: "ASSIGNED",
        statusHistory: { create: [{ toStatus: "REPORTED" }, { fromStatus: "REPORTED", toStatus: "ASSIGNED" }] },
      },
    });
    requestId = req.id;

    const wo = await prisma.workOrder.create({
      data: { ref: `WO-V-${stamp}`, requestId: req.id, vendorId: myVendor.id, status: "ISSUED", currency: "GHS" },
    });
    myWorkOrderId = wo.id;
    const otherReq = await prisma.maintenanceRequest.create({
      data: { ref: `MR-VO-${stamp}`, propertyId, reportedByType: "STAFF", category: "PLUMBING", priority: "LOW", title: "Other job", description: "x", status: "ASSIGNED" },
    });
    const otherWo = await prisma.workOrder.create({
      data: { ref: `WO-VO-${stamp}`, requestId: otherReq.id, vendorId: otherVendor.id, status: "ISSUED", currency: "GHS" },
    });
    otherWorkOrderId = otherWo.id;

    vendorToken = (
      await request(app.getHttpServer()).post("/api/v1/auth/login").send({ identifier: vendorUser.email, password: PASSWORD }).expect(200)
    ).body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.maintenanceStatusHistory.deleteMany({ where: { request: { propertyId } } });
    await prisma.workOrder.deleteMany({ where: { request: { propertyId } } });
    await prisma.maintenanceRequest.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.vendor.deleteMany({ where: { id: { in: cleanupVendors } } });
    await prisma.user.deleteMany({ where: { id: { in: cleanupUsers } } });
    await prisma.domainEvent.deleteMany({ where: { type: "MAINTENANCE_COMPLETED" } });
    await prisma.$disconnect();
    await app.close();
  });

  const asVendor = (m: "get" | "post", path: string) =>
    request(app.getHttpServer())[m](path).set("authorization", `Bearer ${vendorToken}`);

  it("lists only the vendor's own work orders", async () => {
    const res = await asVendor("get", "/api/v1/vendor/work-orders").expect(200);
    const ids = (res.body.data as { id: string }[]).map((w) => w.id);
    expect(ids).toContain(myWorkOrderId);
    expect(ids).not.toContain(otherWorkOrderId);
  });

  it("cannot open another vendor's work order (404, no leak)", async () => {
    const res = await asVendor("get", `/api/v1/vendor/work-orders/${otherWorkOrderId}`);
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain("Other job");
  });

  it("starts and completes its own job, driving the maintenance request", async () => {
    await asVendor("post", `/api/v1/vendor/work-orders/${myWorkOrderId}/start`).expect(201);
    let req = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(req.status).toBe("IN_PROGRESS");

    const done = await request(app.getHttpServer())
      .post(`/api/v1/vendor/work-orders/${myWorkOrderId}/complete`)
      .set("authorization", `Bearer ${vendorToken}`)
      .send({ actualCost: { minor: "45000", currency: "GHS" }, completionNotes: "Replaced the trap." })
      .expect(201);
    expect(done.body.data.status).toBe("COMPLETED");

    req = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(req.status).toBe("COMPLETED");
    expect(req.actualCostMinor?.toString()).toBe("45000");

    const event = await prisma.domainEvent.findFirst({
      where: { type: "MAINTENANCE_COMPLETED", payload: { path: ["maintenanceRequestId"], equals: requestId } },
    });
    expect(event).toBeTruthy();
  });

  it("cannot reach owner or admin endpoints", async () => {
    await asVendor("get", "/api/v1/dashboard/owner").expect(403);
    await asVendor("get", "/api/v1/admin/overview").expect(403);
    await asVendor("get", `/api/v1/properties/${propertyId}/financials`).expect((r) => {
      if (![403, 404].includes(r.status)) throw new Error(`expected 403/404, got ${r.status}`);
    });
  });
});
