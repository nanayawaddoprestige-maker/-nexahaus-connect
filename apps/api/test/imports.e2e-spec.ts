/**
 * CSV import (e2e, spec §105): validate → commit is two-phase; nothing is
 * written until commit; invalid rows are reported and require allowPartial;
 * referenced entities (PROPERTY by clientRef) resolve or fail per-row.
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
const PASSWORD = "ImportTest!2027";
const stamp = Date.now();

describe("CSV import (e2e)", () => {
  let app: INestApplication;
  let admin: string;
  const cleanupUsers: string[] = [];
  const createdClientRefs: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const role = await prisma.role.findUniqueOrThrow({
      where: { key: RoleKey.SUPER_ADMIN },
    });
    const email = `import.admin.${stamp}@nexahaus.test`;
    const user = await prisma.user.create({
      data: {
        email,
        fullName: "Import Admin",
        passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: role.id } },
      },
    });
    cleanupUsers.push(user.id);
    admin = (
      await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ identifier: email, password: PASSWORD })
        .expect(200)
    ).body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.clientOnboarding.deleteMany({
      where: { client: { ref: { in: createdClientRefs } } },
    });
    await prisma.client.deleteMany({
      where: { ref: { in: createdClientRefs } },
    });
    await prisma.importJob.deleteMany({
      where: { createdById: { in: cleanupUsers } },
    });
    await prisma.user.deleteMany({ where: { id: { in: cleanupUsers } } });
    await prisma.$disconnect();
    await app.close();
  });

  it("validate reports per-row errors and writes nothing", async () => {
    const csv = [
      "type,displayName,segment,primaryEmail",
      `INDIVIDUAL,Import One ${stamp},DIASPORA,one.${stamp}@example.com`,
      `INDIVIDUAL,X,DIASPORA,not-an-email`, // displayName too short + bad email
      `COMPANY,Import Two ${stamp},RESIDENT,`,
    ].join("\n");

    const res = await request(app.getHttpServer())
      .post("/api/v1/imports")
      .set("authorization", `Bearer ${admin}`)
      .send({ entity: "CLIENT", csv })
      .expect(201);

    expect(res.body.data.status).toBe("VALIDATED");
    expect(res.body.data.totalRows).toBe(3);
    expect(res.body.data.validRows).toBe(2);
    expect(res.body.data.errorRows).toBe(1);
    expect(
      res.body.data.errors.some(
        (e: { field?: string }) => e.field === "displayName",
      ),
    ).toBe(true);

    // Nothing created yet.
    const created = await prisma.client.count({
      where: { displayName: `Import One ${stamp}` },
    });
    expect(created).toBe(0);
  });

  it("commit is refused while there are errors, then succeeds with allowPartial", async () => {
    const csv = [
      "type,displayName,segment,primaryEmail",
      `INDIVIDUAL,Import Alpha ${stamp},DIASPORA,a.${stamp}@example.com`,
      `INDIVIDUAL,,DIASPORA,b.${stamp}@example.com`,
    ].join("\n");
    const job = (
      await request(app.getHttpServer())
        .post("/api/v1/imports")
        .set("authorization", `Bearer ${admin}`)
        .send({ entity: "CLIENT", csv })
        .expect(201)
    ).body.data;

    await request(app.getHttpServer())
      .post(`/api/v1/imports/${job.id}/commit`)
      .set("authorization", `Bearer ${admin}`)
      .expect(409);

    const committed = (
      await request(app.getHttpServer())
        .post(`/api/v1/imports/${job.id}/commit?allowPartial=true`)
        .set("authorization", `Bearer ${admin}`)
        .expect(201)
    ).body.data;
    expect(committed.status).toBe("COMPLETED");
    expect(committed.createdRefs).toHaveLength(1);
    createdClientRefs.push(...committed.createdRefs);

    const created = await prisma.client.findFirst({
      where: { displayName: `Import Alpha ${stamp}` },
    });
    expect(created).toBeTruthy();
  });

  it("a PROPERTY row with an unknown clientRef fails at commit and is reported", async () => {
    const clientRef = createdClientRefs[0]!;
    const csv = [
      "clientRef,name,type,addressLine,city,region",
      `${clientRef},Imported Flat ${stamp},APARTMENT,1 Import Rd,Accra,Greater Accra`,
      `CL-DOES-NOT-EXIST,Ghost Flat,APARTMENT,2 Nowhere,Accra,Greater Accra`,
    ].join("\n");
    const job = (
      await request(app.getHttpServer())
        .post("/api/v1/imports")
        .set("authorization", `Bearer ${admin}`)
        .send({ entity: "PROPERTY", csv })
        .expect(201)
    ).body.data;
    expect(job.errorRows).toBe(0); // both rows are structurally valid

    const committed = (
      await request(app.getHttpServer())
        .post(`/api/v1/imports/${job.id}/commit`)
        .set("authorization", `Bearer ${admin}`)
        .expect(201)
    ).body.data;
    expect(committed.status).toBe("PARTIALLY_COMPLETED");
    expect(committed.createdRefs).toHaveLength(1);
    expect(committed.commitFailures).toHaveLength(1);
    expect(committed.commitFailures[0].message).toMatch(/client not found/i);

    // clean up the property we made
    await prisma.propertyOwner.deleteMany({
      where: { property: { name: `Imported Flat ${stamp}` } },
    });
    await prisma.propertyOnboardingChecklist.deleteMany({
      where: { property: { name: `Imported Flat ${stamp}` } },
    });
    await prisma.property.deleteMany({
      where: { name: `Imported Flat ${stamp}` },
    });
  });

  it("only staff with settings:write can import", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/imports")
      .send({ entity: "CLIENT", csv: "type,displayName\nINDIVIDUAL,Nope" })
      .expect(401);
  });
});
