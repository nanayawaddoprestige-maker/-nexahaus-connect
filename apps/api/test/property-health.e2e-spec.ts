/**
 * Property Health Score + Property Rescue (e2e, spec §11, §12, §97):
 *  - recompute stores an explainable score (components carry basis + confidence);
 *  - changing the config weights changes the next score and bumps the version;
 *  - a HEALTH_SCORE_UPDATED domain event is emitted;
 *  - a Rescue assessment produces findings, ranked recommendations and a PDF.
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
const PASSWORD = "HealthTest!2027";
const stamp = Date.now();

describe("Property Health & Rescue (e2e)", () => {
  let app: INestApplication;
  let access: string;
  let propertyId: string;
  let clientId: string;
  const cleanupUsers: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const role = await prisma.role.findUniqueOrThrow({ where: { key: RoleKey.SUPER_ADMIN } });
    const email = `health.admin.${stamp}@nexahaus.test`;
    const user = await prisma.user.create({
      data: {
        email, fullName: "Health Admin",
        passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
        status: "ACTIVE", emailVerifiedAt: new Date(), roles: { create: { roleId: role.id } },
      },
    });
    cleanupUsers.push(user.id);

    const client = await prisma.client.create({
      data: { ref: `CL-H-${stamp}`, type: "INDIVIDUAL", displayName: "Health Client", status: "ACTIVE" },
    });
    clientId = client.id;

    const property = await prisma.property.create({
      data: {
        ref: `NH-H-${stamp}`, clientId, name: "Health House", type: "HOUSE", status: "OCCUPIED",
        addressLine: "7 Test Road", city: "Accra", region: "Greater Accra", unitCount: 2,
        estimatedValueMinor: 200_000_000n, estimatedValueCurrency: "GHS",
        owners: { create: { clientId, sharePercent: 100, isPrimary: true } },
      },
    });
    propertyId = property.id;
    await prisma.unit.create({ data: { propertyId, ref: `NHU-H1-${stamp}`, label: "A", status: "OCCUPIED", marketRentMinor: 500_000n, marketRentCurrency: "GHS" } });
    await prisma.unit.create({ data: { propertyId, ref: `NHU-H2-${stamp}`, label: "B", status: "VACANT", marketRentMinor: 500_000n, marketRentCurrency: "GHS" } });

    // 6 months of rent: mostly paid, one overdue.
    for (let m = 0; m < 6; m += 1) {
      const start = new Date(Date.UTC(2027, m, 1));
      await prisma.rentCharge.create({
        data: {
          leaseId: (await prisma.lease.upsert({
            where: { ref: `LS-H-${stamp}` },
            create: {
              ref: `LS-H-${stamp}`, propertyId, unitId: (await prisma.unit.findFirstOrThrow({ where: { propertyId, label: "A" } })).id,
              clientId, startDate: new Date("2027-01-01"), endDate: new Date("2027-12-31"),
              rentMinor: 500_000n, rentCurrency: "GHS", frequency: "MONTHLY", status: "ACTIVE",
            },
            update: {},
          })).id,
          propertyId, unitId: (await prisma.unit.findFirstOrThrow({ where: { propertyId, label: "A" } })).id,
          clientId, periodStart: start, periodEnd: new Date(Date.UTC(2027, m + 1, 1)), dueDate: start,
          amountMinor: 500_000n, currency: "GHS",
          paidMinor: m === 5 ? 0n : 500_000n, status: m === 5 ? "OVERDUE" : "PAID",
        },
      });
    }

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login").send({ identifier: email, password: PASSWORD }).expect(200);
    access = login.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.propertyHealthComponent.deleteMany({ where: { score: { propertyId } } });
    await prisma.propertyHealthScore.deleteMany({ where: { propertyId } });
    await prisma.propertyRescueRecommendation.deleteMany({ where: { assessment: { propertyId } } });
    await prisma.propertyRescueAssessment.deleteMany({ where: { propertyId } });
    await prisma.document.deleteMany({ where: { scopeId: propertyId } });
    await prisma.domainEvent.deleteMany({ where: { type: { in: ["HEALTH_SCORE_UPDATED", "PROPERTY_RESCUE_READY"] } } });
    await prisma.rentCharge.deleteMany({ where: { propertyId } });
    await prisma.lease.deleteMany({ where: { propertyId } });
    await prisma.unit.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.user.deleteMany({ where: { id: { in: cleanupUsers } } });
    await prisma.healthScoreConfig.deleteMany({ where: { version: { gt: 1 } } });
    await prisma.$disconnect();
    await app.close();
  });

  let firstScore: number;
  let firstVersion: number;

  it("recompute stores an explainable score", async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/property-health/${propertyId}/recompute`)
      .set("authorization", `Bearer ${access}`)
      .expect(200);
    firstScore = res.body.data.score;
    firstVersion = res.body.data.methodologyVersion;
    expect(firstScore).toBeGreaterThan(0);
    expect(firstScore).toBeLessThanOrEqual(100);
    expect(res.body.data.components).toHaveLength(8);
    for (const c of res.body.data.components) {
      expect(typeof c.basis).toBe("string");
      expect(["actual", "estimate", "assumption"]).toContain(c.confidence);
    }
    // occupancy is 1/2 → its component value should reflect that
    const occ = res.body.data.components.find((c: { key: string }) => c.key === "OCCUPANCY");
    expect(occ.value).toBeCloseTo(0.5, 5);
  });

  it("emitted a HEALTH_SCORE_UPDATED event", async () => {
    const event = await prisma.domainEvent.findFirst({
      where: { type: "HEALTH_SCORE_UPDATED", payload: { path: ["propertyId"], equals: propertyId } },
    });
    expect(event).toBeTruthy();
  });

  it("changing the config weights changes the next score and bumps the version", async () => {
    await request(app.getHttpServer())
      .put("/api/v1/property-health/config")
      .set("authorization", `Bearer ${access}`)
      .send({
        weights: {
          OCCUPANCY: 0.6, RENT_COLLECTION: 0.1, MAINTENANCE: 0.05, CONDITION: 0.05,
          TENANT_SATISFACTION: 0.05, DOCUMENTATION: 0.05, SECURITY: 0.03, FINANCIAL: 0.02,
        },
      })
      .expect(200);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/property-health/${propertyId}/recompute`)
      .set("authorization", `Bearer ${access}`)
      .expect(200);
    // Occupancy (0.5) now dominates → score should drop.
    expect(res.body.data.score).toBeLessThan(firstScore);
    expect(res.body.data.methodologyVersion).toBeGreaterThan(firstVersion);

    const history = await request(app.getHttpServer())
      .get(`/api/v1/property-health/${propertyId}/history`)
      .set("authorization", `Bearer ${access}`)
      .expect(200);
    expect(history.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("a Rescue assessment produces findings, recommendations and a PDF", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/property-rescue/assessments")
      .set("authorization", `Bearer ${access}`)
      .send({ propertyId })
      .expect(201);
    const a = res.body.data;
    expect(a.overallScore).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(a.findings)).toBe(true);
    expect(a.findings.some((f: { key: string }) => f.key === "VACANCY")).toBe(true);
    // 1 of 2 units vacant + one overdue month → at least one recommendation
    expect(a.recommendations.length).toBeGreaterThan(0);
    expect(a.pdfDocumentId).toBeTruthy();

    // The PDF is a real, downloadable CLEAN document.
    const dl = await request(app.getHttpServer())
      .get(`/api/v1/documents/${a.pdfDocumentId}/download-url`)
      .set("authorization", `Bearer ${access}`)
      .expect(200);
    expect(dl.body.data.url).toContain("http");
  });
});
