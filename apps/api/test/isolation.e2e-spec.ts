/**
 * RELEASE-BLOCKING (spec §79, §84): an owner must never be able to reach another
 * owner's data. This exercises the real HTTP stack (guards + scope resolver +
 * repositories) against a live Postgres.
 *
 * Requires DATABASE_URL pointing at a disposable test database with the schema
 * migrated. Run via `pnpm --filter @nexahaus/api test:e2e`.
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
const PASSWORD = "IsolationTest!2027";

interface Owner {
  email: string;
  clientId: string;
  propertyId: string;
  access: string;
}

async function makeOwner(label: string): Promise<Owner> {
  const passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });
  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: RoleKey.OWNER } });
  const email = `owner.${label}.${Date.now()}@nexahaus.test`;

  const user = await prisma.user.create({
    data: {
      email,
      fullName: `Owner ${label}`,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      roles: { create: { roleId: ownerRole.id } },
    },
  });

  const client = await prisma.client.create({
    data: {
      ref: `CL-ISO-${label}-${Date.now()}`,
      type: "INDIVIDUAL",
      displayName: `Client ${label}`,
      status: "ACTIVE",
      users: { create: { userId: user.id, relationship: "PRIMARY", acceptedAt: new Date() } },
    },
  });

  const property = await prisma.property.create({
    data: {
      ref: `NH-ISO-${label}-${Date.now()}`,
      clientId: client.id,
      name: `${label} House`,
      type: "HOUSE",
      status: "OCCUPIED",
      addressLine: "1 Test Road",
      city: "Accra",
      region: "Greater Accra",
      unitCount: 1,
      owners: { create: { clientId: client.id, sharePercent: 100, isPrimary: true } },
    },
  });

  return { email, clientId: client.id, propertyId: property.id, access: "" };
}

describe("Multi-tenant isolation (e2e)", () => {
  let app: INestApplication;
  let a: Owner;
  let b: Owner;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    a = await makeOwner("A");
    b = await makeOwner("B");

    for (const owner of [a, b]) {
      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ identifier: owner.email, password: PASSWORD })
        .expect(200);
      owner.access = res.body.data.tokens.accessToken as string;
    }
  });

  afterAll(async () => {
    await prisma.property.deleteMany({ where: { id: { in: [a.propertyId, b.propertyId] } } });
    await prisma.client.deleteMany({ where: { id: { in: [a.clientId, b.clientId] } } });
    await prisma.user.deleteMany({ where: { email: { in: [a.email, b.email] } } });
    await prisma.$disconnect();
    await app.close();
  });

  it("each owner sees only their own property in the list", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/properties")
      .set("authorization", `Bearer ${a.access}`)
      .expect(200);
    const ids = (res.body.data as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(a.propertyId);
    expect(ids).not.toContain(b.propertyId);
  });

  it("Owner A GET /properties/:id on Owner B's property is denied and leaks nothing", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/properties/${b.propertyId}`)
      .set("authorization", `Bearer ${a.access}`);
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain("B House");
    expect(res.body.error).not.toHaveProperty("resource");
  });

  it("Owner A cannot read Owner B's property financials", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/properties/${b.propertyId}/financials`)
      .set("authorization", `Bearer ${a.access}`);
    expect([403, 404]).toContain(res.status);
  });

  it("Owner A cannot PATCH Owner B's property", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/properties/${b.propertyId}`)
      .set("authorization", `Bearer ${a.access}`)
      .send({ name: "Hijacked" });
    expect([403, 404]).toContain(res.status);
    const still = await prisma.property.findUnique({ where: { id: b.propertyId } });
    expect(still?.name).toBe("B House");
  });

  it("Owner A cannot widen scope by passing Owner B's clientId as a filter", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/properties")
      .query({ clientId: b.clientId })
      .set("authorization", `Bearer ${a.access}`)
      .expect(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("an unauthenticated request is rejected", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/properties/${a.propertyId}`)
      .expect(401);
  });

  it("the owner dashboard aggregates only the caller's portfolio", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/dashboard/owner")
      .set("authorization", `Bearer ${a.access}`)
      .expect(200);
    expect(res.body.data.portfolio.totalProperties).toBe(1);
  });
});
