/**
 * Maintenance workflow (e2e, spec §82 + §112 journey 4): REPORTED → ACKNOWLEDGED
 * → ASSIGNED → SCHEDULED → IN_PROGRESS → (cost over threshold ⇒ AWAITING_APPROVAL
 * → owner approves) → COMPLETED → VERIFIED → CLOSED, with a
 * MaintenanceStatusHistory + AuditLog row for every transition and an
 * illegal-transition rejection.
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
const PASSWORD = "MaintTest!2027";
const stamp = Date.now();

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post("/api/v1/auth/login")
    .send({ identifier: email, password: PASSWORD })
    .expect(200);
  return res.body.data.tokens.accessToken;
}

describe("Maintenance workflow (e2e)", () => {
  let app: INestApplication;
  let staff: string;
  let owner: string;
  let propertyId: string;
  let requestId: string;
  const cleanup: { users: string[]; clients: string[] } = { users: [], clients: [] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const hash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
    const [adminRole, ownerRole] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { key: RoleKey.SUPER_ADMIN } }),
      prisma.role.findUniqueOrThrow({ where: { key: RoleKey.OWNER } }),
    ]);

    const staffUser = await prisma.user.create({
      data: {
        email: `maint.staff.${stamp}@nexahaus.test`,
        fullName: "Maint Staff",
        passwordHash: hash,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: adminRole.id } },
      },
    });
    const ownerUser = await prisma.user.create({
      data: {
        email: `maint.owner.${stamp}@nexahaus.test`,
        fullName: "Maint Owner",
        passwordHash: hash,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: ownerRole.id } },
      },
    });
    cleanup.users.push(staffUser.id, ownerUser.id);

    const client = await prisma.client.create({
      data: {
        ref: `CL-MAINT-${stamp}`,
        type: "INDIVIDUAL",
        displayName: "Maint Client",
        status: "ACTIVE",
        users: { create: { userId: ownerUser.id, relationship: "PRIMARY", canApprove: true, acceptedAt: new Date() } },
      },
    });
    cleanup.clients.push(client.id);

    const property = await prisma.property.create({
      data: {
        ref: `NH-MAINT-${stamp}`,
        clientId: client.id,
        name: "Maint Test House",
        type: "HOUSE",
        status: "OCCUPIED",
        addressLine: "3 Test Road",
        city: "Accra",
        region: "Greater Accra",
        unitCount: 1,
        owners: { create: { clientId: client.id, sharePercent: 100, isPrimary: true } },
        agreements: {
          create: {
            feeType: "PERCENT_OF_COLLECTED",
            feePercent: 10,
            feeCurrency: "GHS",
            startDate: new Date("2027-01-01"),
            inspectionFrequency: "QUARTERLY",
            maintenanceApprovalThresholdMinor: 150_000n, // GHS 1,500
            thresholdCurrency: "GHS",
            status: "ACTIVE",
          },
        },
      },
    });
    propertyId = property.id;

    staff = await login(app, staffUser.email!);
    owner = await login(app, ownerUser.email!);
  });

  afterAll(async () => {
    await prisma.approvalEvent.deleteMany({ where: { approval: { propertyId } } });
    await prisma.approval.deleteMany({ where: { propertyId } });
    await prisma.maintenanceStatusHistory.deleteMany({ where: { request: { propertyId } } });
    await prisma.workOrder.deleteMany({ where: { request: { propertyId } } });
    await prisma.maintenanceRequest.deleteMany({ where: { propertyId } });
    await prisma.managementAgreement.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.client.deleteMany({ where: { id: { in: cleanup.clients } } });
    await prisma.user.deleteMany({ where: { id: { in: cleanup.users } } });
    await prisma.$disconnect();
    await app.close();
  });

  const move = (token: string, to: string, body: Record<string, unknown> = {}) =>
    request(app.getHttpServer())
      .post(`/api/v1/maintenance/${requestId}/transition`)
      .set("authorization", `Bearer ${token}`)
      .send({ toStatus: to, ...body });

  it("creates a REPORTED request", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/maintenance")
      .set("authorization", `Bearer ${staff}`)
      .send({
        propertyId,
        category: "PLUMBING",
        priority: "HIGH",
        title: "Burst pipe under the kitchen sink",
        description: "Water pooling in the cabinet.",
      })
      .expect(201);
    requestId = res.body.data.id;
    expect(res.body.data.status).toBe("REPORTED");
  });

  it("rejects an illegal transition (REPORTED → CLOSED)", async () => {
    const res = await move(staff, "CLOSED");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ILLEGAL_STATE_TRANSITION");
  });

  it("walks REPORTED → ACKNOWLEDGED → ASSIGNED → SCHEDULED", async () => {
    await move(staff, "ACKNOWLEDGED").expect(201);
    await move(staff, "ASSIGNED").expect(201);
    await move(staff, "SCHEDULED", { scheduledFor: "2027-09-20T09:00:00.000Z" }).expect(201);
  });

  it("an estimate over the threshold diverts IN_PROGRESS to AWAITING_APPROVAL and raises an Approval", async () => {
    const res = await move(staff, "IN_PROGRESS", {
      estimatedCost: { minor: "185000", currency: "GHS" }, // GHS 1,850 > 1,500
    }).expect(201);
    expect(res.body.data.status).toBe("AWAITING_APPROVAL");

    const approval = await prisma.approval.findFirst({
      where: { subjectRefId: requestId, type: "MAINTENANCE_COST", status: "PENDING" },
    });
    expect(approval).toBeTruthy();
    expect(approval!.amountMinor?.toString()).toBe("185000");
  });

  it("the owner approves; the request returns to IN_PROGRESS with the approved cost", async () => {
    const approval = await prisma.approval.findFirstOrThrow({
      where: { subjectRefId: requestId, status: "PENDING" },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/approvals/${approval.id}/decision`)
      .set("authorization", `Bearer ${owner}`)
      .send({ decision: "APPROVED" })
      .expect(201);

    const reqRow = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(reqRow.status).toBe("IN_PROGRESS");
    expect(reqRow.approvedCostMinor?.toString()).toBe("185000");
  });

  it("completes, verifies and closes", async () => {
    await move(staff, "COMPLETED").expect(201);
    await move(staff, "VERIFIED").expect(201);
    await move(staff, "CLOSED").expect(201);
    const reqRow = await prisma.maintenanceRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(reqRow.status).toBe("CLOSED");
    expect(reqRow.closedAt).not.toBeNull();
  });

  it("recorded a status-history row for every transition", async () => {
    const history = await prisma.maintenanceStatusHistory.findMany({
      where: { requestId },
      orderBy: { changedAt: "asc" },
    });
    const path = history.map((h) => h.toStatus);
    expect(path).toEqual([
      "REPORTED",
      "ACKNOWLEDGED",
      "ASSIGNED",
      "SCHEDULED",
      "AWAITING_APPROVAL",
      "IN_PROGRESS",
      "COMPLETED",
      "VERIFIED",
      "CLOSED",
    ]);
  });

  it("recorded audit entries for the transitions and the approval", async () => {
    const audit = await prisma.auditLog.findMany({
      where: {
        OR: [
          { resourceType: "maintenance_request", resourceId: requestId },
          { resourceType: "approval" },
        ],
      },
      select: { action: true },
    });
    const actions = new Set(audit.map((a) => a.action));
    expect(actions.has("maintenance.create")).toBe(true);
    expect(actions.has("maintenance.transition")).toBe(true);
    expect(actions.has("approval.approved")).toBe(true);
  });

  it("emitted the maintenance domain events", async () => {
    const events = await prisma.domainEvent.findMany({
      where: { type: { in: ["MAINTENANCE_CREATED", "MAINTENANCE_COMPLETED", "APPROVAL_REQUIRED"] } },
      orderBy: { occurredAt: "asc" },
    });
    const types = new Set(events.map((e) => e.type));
    expect(types.has("MAINTENANCE_CREATED")).toBe(true);
    expect(types.has("APPROVAL_REQUIRED")).toBe(true);
    expect(types.has("MAINTENANCE_COMPLETED")).toBe(true);
  });
});
