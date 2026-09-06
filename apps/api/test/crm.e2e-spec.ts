/**
 * CRM funnel (e2e, spec §36, §39, §74):
 *  - a public Property Health Check returns a preliminary score and creates a
 *    scored CRM Lead + a consent record;
 *  - logging a consultation raises the lead score;
 *  - converting the lead creates an ONBOARDING client and carries the consent;
 *  - a repeat submission with the same email updates the lead, not a duplicate.
 *
 * Requires a migrated disposable DATABASE_URL with the seed applied (needs the
 * OWNER/staff roles). Run: pnpm --filter @nexahaus/api test:e2e
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
const PASSWORD = "CrmTest!2027";
const stamp = Date.now();
const leadEmail = `owner.enquiry.${stamp}@example.com`;

describe("CRM funnel (e2e)", () => {
  let app: INestApplication;
  let staff: string;
  const cleanupUsers: string[] = [];
  let leadId: string;
  let convertedClientId: string | null = null;

  const healthCheckBody = (over: Record<string, unknown> = {}) => ({
    contactName: "Kojo Enquiry",
    email: leadEmail,
    phone: "+233201234599",
    livesInGhana: false,
    location: "Toronto, Canada",
    propertyCount: 3,
    answers: {
      occupied: true,
      managedProfessionally: false,
      tenantsPayOnTime: "SOMETIMES",
      inspectionFrequency: "NEVER",
      receivesFinancialReports: false,
      documentsInOrder: false,
      lastMaintenanceRecent: false,
    },
    consent: { marketing: true, wording: "I agree to be contacted about my assessment." },
    ...over,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const role = await prisma.role.findUniqueOrThrow({ where: { key: RoleKey.SUPER_ADMIN } });
    const email = `crm.staff.${stamp}@nexahaus.test`;
    const user = await prisma.user.create({
      data: {
        email, fullName: "CRM Staff",
        passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
        status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId: role.id } },
      },
    });
    cleanupUsers.push(user.id);
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login").send({ identifier: email, password: PASSWORD }).expect(200);
    staff = login.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (convertedClientId) {
      await prisma.clientOnboarding.deleteMany({ where: { clientId: convertedClientId } });
      await prisma.consentRecord.deleteMany({ where: { subjectId: convertedClientId } });
      await prisma.client.deleteMany({ where: { id: convertedClientId } });
    }
    const leads = await prisma.lead.findMany({ where: { email: { equals: leadEmail, mode: "insensitive" } }, select: { id: true } });
    const ids = leads.map((l) => l.id);
    await prisma.consentRecord.deleteMany({ where: { subjectId: { in: ids } } });
    await prisma.propertyHealthCheck.deleteMany({ where: { leadId: { in: ids } } });
    await prisma.leadActivity.deleteMany({ where: { leadId: { in: ids } } });
    await prisma.lead.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: cleanupUsers } } });
    await prisma.$disconnect();
    await app.close();
  });

  it("a public health check returns a preliminary score and creates a scored lead + consent", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/public/property-health-check")
      .send(healthCheckBody())
      .expect(201);
    expect(res.body.data.preliminaryScore).toBeGreaterThanOrEqual(0);
    expect(res.body.data.preliminaryScore).toBeLessThanOrEqual(100);
    expect(res.body.data.disclaimer).toMatch(/not a professional/i);

    const lead = await prisma.lead.findFirstOrThrow({
      where: { email: { equals: leadEmail, mode: "insensitive" } },
    });
    leadId = lead.id;
    // diaspora (15) + multi-property (>=4? no, 3 → band 2 = 12) + management need? no
    // + assessment completed (20) → >= grade C
    expect(lead.score).toBeGreaterThanOrEqual(35);
    expect(["A", "B", "C"]).toContain(lead.grade);

    const consent = await prisma.consentRecord.findFirst({
      where: { subjectType: "LEAD", subjectId: lead.id, source: "public.health-check" },
    });
    expect(consent).toBeTruthy();
  });

  it("a repeat submission with the same email updates the lead, not a duplicate", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/public/property-health-check")
      .send(healthCheckBody({ propertyCount: 6 }))
      .expect(201);
    const count = await prisma.lead.count({
      where: { email: { equals: leadEmail, mode: "insensitive" } },
    });
    expect(count).toBe(1);
    const lead = await prisma.lead.findFirstOrThrow({ where: { id: leadId } });
    expect(lead.propertyCount).toBe(6);
  });

  it("logging a consultation raises the lead score", async () => {
    const before = (await prisma.lead.findFirstOrThrow({ where: { id: leadId } })).score;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${leadId}/activities`)
      .set("authorization", `Bearer ${staff}`)
      .send({ type: "MEETING", body: "Discovery call held, keen to proceed." })
      .expect(201);
    expect(res.body.data.score).toBeGreaterThan(before);
  });

  it("converting the lead creates an ONBOARDING client and carries the consent", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${leadId}/convert`)
      .set("authorization", `Bearer ${staff}`)
      .send({ clientType: "INDIVIDUAL", segment: "DIASPORA" })
      .expect(201);
    convertedClientId = res.body.data.clientId;

    const client = await prisma.client.findUniqueOrThrow({ where: { id: convertedClientId! } });
    expect(client.status).toBe("ONBOARDING");
    expect(client.primaryEmail).toBe(leadEmail);

    const lead = await prisma.lead.findFirstOrThrow({ where: { id: leadId } });
    expect(lead.status).toBe("WON");
    expect(lead.convertedClientId).toBe(convertedClientId);

    const consent = await prisma.consentRecord.findFirst({
      where: { subjectType: "CLIENT", subjectId: convertedClientId! },
    });
    expect(consent).toBeTruthy();

    // A second convert is a conflict.
    await request(app.getHttpServer())
      .post(`/api/v1/leads/${leadId}/convert`)
      .set("authorization", `Bearer ${staff}`)
      .send({})
      .expect(409);
  });
});
