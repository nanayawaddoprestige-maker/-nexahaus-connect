/**
 * Notification pipeline + message scoping (e2e, spec §28, §29, §51):
 *  - a domain event in the outbox, once pumped, produces the right in-app
 *    notification for the right user;
 *  - turning off in-app delivery for a type suppresses the feed row;
 *  - a message thread is visible only to its participants.
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
import { OutboxService } from "../src/modules/notifications/outbox.service";

const prisma = new PrismaClient();
const PASSWORD = "NotifyTest!2027";
const stamp = Date.now();

describe("Notifications & messaging (e2e)", () => {
  let app: INestApplication;
  let outbox: OutboxService;
  let staff: string;
  let ownerA: string;
  let ownerB: string;
  let ownerAUserId: string;
  let clientAId: string;
  let propertyAId: string;
  const cleanupUsers: string[] = [];
  const cleanupClients: string[] = [];

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ identifier: email, password: PASSWORD })
      .expect(200);
    return res.body.data.tokens.accessToken;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    outbox = app.get(OutboxService);

    const hash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
    const [adminRole, ownerRole] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { key: RoleKey.SUPER_ADMIN } }),
      prisma.role.findUniqueOrThrow({ where: { key: RoleKey.OWNER } }),
    ]);

    const staffUser = await prisma.user.create({
      data: { email: `n.staff.${stamp}@nexahaus.test`, fullName: "N Staff", passwordHash: hash, status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId: adminRole.id } } },
    });
    const ownerAUser = await prisma.user.create({
      data: { email: `n.ownerA.${stamp}@nexahaus.test`, fullName: "Owner A", passwordHash: hash, status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId: ownerRole.id } } },
    });
    const ownerBUser = await prisma.user.create({
      data: { email: `n.ownerB.${stamp}@nexahaus.test`, fullName: "Owner B", passwordHash: hash, status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId: ownerRole.id } } },
    });
    ownerAUserId = ownerAUser.id;
    cleanupUsers.push(staffUser.id, ownerAUser.id, ownerBUser.id);

    const clientA = await prisma.client.create({
      data: {
        ref: `CL-N-A-${stamp}`, type: "INDIVIDUAL", displayName: "N Client A", status: "ACTIVE",
        users: { create: { userId: ownerAUser.id, relationship: "PRIMARY", canApprove: true, acceptedAt: new Date() } },
      },
    });
    const clientB = await prisma.client.create({
      data: {
        ref: `CL-N-B-${stamp}`, type: "INDIVIDUAL", displayName: "N Client B", status: "ACTIVE",
        users: { create: { userId: ownerBUser.id, relationship: "PRIMARY", acceptedAt: new Date() } },
      },
    });
    clientAId = clientA.id;
    cleanupClients.push(clientA.id, clientB.id);

    const propertyA = await prisma.property.create({
      data: {
        ref: `NH-N-${stamp}`, clientId: clientA.id, name: "N House", type: "HOUSE", status: "OCCUPIED",
        addressLine: "6 Test Road", city: "Accra", region: "Greater Accra", unitCount: 1,
        owners: { create: { clientId: clientA.id, sharePercent: 100, isPrimary: true } },
        agreements: {
          create: {
            feeType: "PERCENT_OF_COLLECTED", feePercent: 10, feeCurrency: "GHS",
            startDate: new Date("2027-01-01"), inspectionFrequency: "QUARTERLY",
            maintenanceApprovalThresholdMinor: 150_000n, thresholdCurrency: "GHS", status: "ACTIVE",
          },
        },
      },
    });
    propertyAId = propertyA.id;

    staff = await login(staffUser.email!);
    ownerA = await login(ownerAUser.email!);
    ownerB = await login(ownerBUser.email!);
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: cleanupUsers } } });
    await prisma.notificationPreference.deleteMany({ where: { userId: { in: cleanupUsers } } });
    await prisma.message.deleteMany({ where: { thread: { propertyId: propertyAId } } });
    await prisma.threadParticipant.deleteMany({ where: { thread: { propertyId: propertyAId } } });
    await prisma.messageThread.deleteMany({ where: { propertyId: propertyAId } });
    await prisma.domainEvent.deleteMany({ where: { payload: { path: ["propertyId"], equals: propertyAId } } });
    await prisma.approvalEvent.deleteMany({ where: { approval: { propertyId: propertyAId } } });
    await prisma.approval.deleteMany({ where: { propertyId: propertyAId } });
    await prisma.maintenanceStatusHistory.deleteMany({ where: { request: { propertyId: propertyAId } } });
    await prisma.maintenanceRequest.deleteMany({ where: { propertyId: propertyAId } });
    await prisma.managementAgreement.deleteMany({ where: { propertyId: propertyAId } });
    await prisma.property.deleteMany({ where: { id: propertyAId } });
    await prisma.client.deleteMany({ where: { id: { in: cleanupClients } } });
    await prisma.user.deleteMany({ where: { id: { in: cleanupUsers } } });
    await prisma.$disconnect();
    await app.close();
  });

  it("an APPROVAL_REQUIRED event becomes an in-app notification for the owner", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/maintenance")
      .set("authorization", `Bearer ${staff}`)
      .send({ propertyId: propertyAId, category: "PLUMBING", priority: "HIGH", title: "Leak", description: "Under the sink." })
      .expect(201);
    const id = created.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/maintenance/${id}/transition`)
      .set("authorization", `Bearer ${staff}`)
      .send({ toStatus: "ACKNOWLEDGED" })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/maintenance/${id}/transition`)
      .set("authorization", `Bearer ${staff}`)
      .send({ toStatus: "ASSIGNED" })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/maintenance/${id}/transition`)
      .set("authorization", `Bearer ${staff}`)
      .send({ toStatus: "IN_PROGRESS", estimatedCost: { minor: "200000", currency: "GHS" } })
      .expect(201);

    await outbox.pump();

    const feed = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("authorization", `Bearer ${ownerA}`)
      .expect(200);
    const types = (feed.body.data as { type: string }[]).map((n) => n.type);
    expect(types).toContain("APPROVAL_REQUIRED");
    expect(feed.body.meta.unread).toBeGreaterThan(0);
  });

  it("mark-read clears the unread count", async () => {
    const feed = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("authorization", `Bearer ${ownerA}`);
    const first = feed.body.data[0].id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/notifications/${first}/read`)
      .set("authorization", `Bearer ${ownerA}`)
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/notifications/read-all")
      .set("authorization", `Bearer ${ownerA}`)
      .expect(200);
    const after = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("authorization", `Bearer ${ownerA}`);
    expect(after.body.meta.unread).toBe(0);
  });

  it("disabling in-app delivery for a type suppresses the feed row", async () => {
    await request(app.getHttpServer())
      .put("/api/v1/notifications/preferences")
      .set("authorization", `Bearer ${ownerA}`)
      .send({ type: "RENT_RECEIVED", inApp: false })
      .expect(200);

    await prisma.domainEvent.create({
      data: {
        type: "PAYMENT_RECEIVED",
        payload: { clientId: clientAId, propertyId: propertyAId, paymentId: "x", amountMinor: "1", currency: "GHS" },
      },
    });
    await outbox.pump();

    const feed = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("authorization", `Bearer ${ownerA}`);
    const rentRows = (feed.body.data as { type: string }[]).filter((n) => n.type === "RENT_RECEIVED");
    expect(rentRows).toHaveLength(0);
  });

  it("a message thread is visible only to its participants", async () => {
    const thread = await request(app.getHttpServer())
      .post("/api/v1/messages/threads")
      .set("authorization", `Bearer ${ownerA}`)
      .send({ type: "OWNER_NEXAHAUS", title: "Question about NH-N", propertyId: propertyAId, firstMessage: "Hello, a question." })
      .expect(201);
    const threadId = thread.body.data.id as string;

    // Owner A (a participant) can read it.
    await request(app.getHttpServer())
      .get(`/api/v1/messages/threads/${threadId}`)
      .set("authorization", `Bearer ${ownerA}`)
      .expect(200);

    // Owner B (not a participant) cannot — 404, no leak.
    const denied = await request(app.getHttpServer())
      .get(`/api/v1/messages/threads/${threadId}`)
      .set("authorization", `Bearer ${ownerB}`);
    expect(denied.status).toBe(404);
    expect(JSON.stringify(denied.body)).not.toContain("a question");

    // Owner B's thread list does not include it.
    const list = await request(app.getHttpServer())
      .get("/api/v1/messages/threads")
      .set("authorization", `Bearer ${ownerB}`)
      .expect(200);
    expect((list.body.data as { id: string }[]).some((t) => t.id === threadId)).toBe(false);
  });

  it("replying emits MESSAGE_RECEIVED → the other participant is notified", async () => {
    const thread = await prisma.messageThread.findFirstOrThrow({
      where: { propertyId: propertyAId },
      include: { participants: true },
    });
    const staffParticipant = thread.participants.find((p) => p.role === "NEXAHAUS_SIDE");
    expect(staffParticipant).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/api/v1/messages/threads/${thread.id}/messages`)
      .set("authorization", `Bearer ${ownerA}`)
      .send({ body: "A follow-up from the owner." })
      .expect(201);
    await outbox.pump();

    const notif = await prisma.notification.findFirst({
      where: { userId: staffParticipant!.userId, type: "MESSAGE_RECEIVED" },
    });
    expect(notif).toBeTruthy();
  });
});
