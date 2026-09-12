/**
 * Auth flow (e2e): register → verify (OTP) → login → refresh rotation →
 * reuse of a rotated refresh token revokes the whole chain (spec §46, §80).
 *
 * Requires a migrated disposable DATABASE_URL. The dev OtpService logs the code;
 * this test reads the latest challenge straight from the DB instead.
 */
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/http-exception.filter";
import { ResponseInterceptor } from "../src/common/response.interceptor";

const prisma = new PrismaClient();

/** The dev OTP is 6 random digits; brute-force the hash against the stored value. */
function crackOtp(codeHash: string): string {
  for (let n = 0; n < 1_000_000; n += 1) {
    const code = n.toString().padStart(6, "0");
    if (createHash("sha256").update(code).digest("hex") === codeHash)
      return code;
  }
  throw new Error("otp not found");
}

describe("Auth flow (e2e)", () => {
  let app: INestApplication;
  const email = `flow.${Date.now()}@nexahaus.test`;
  const password = "AuthFlow!2027xyz";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
    await app.close();
  });

  it("registers, verifies and logs in", async () => {
    const reg = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ fullName: "Flow Tester", email, password })
      .expect(201);
    const challengeId = reg.body.data.challengeId as string;

    const challenge = await prisma.otpChallenge.findUniqueOrThrow({
      where: { id: challengeId },
    });
    const code = crackOtp(challenge.codeHash);

    await request(app.getHttpServer())
      .post("/api/v1/auth/verify")
      .send({ challengeId, code, purpose: "VERIFY_EMAIL" })
      .expect(200);

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ identifier: email, password })
      .expect(200);
    expect(login.body.data.tokens.accessToken).toBeTruthy();
    expect(login.body.data.tokens.refreshToken).toBeTruthy();
  });

  it("rotates the refresh token and revokes the chain on reuse", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ identifier: email, password })
      .expect(200);
    const original = login.body.data.tokens.refreshToken as string;

    const rotated = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: original })
      .expect(200);
    const next = rotated.body.data.refreshToken as string;
    expect(next).not.toBe(original);

    // Reusing the original (now rotated) token must fail AND kill the new one.
    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: original })
      .expect(401);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: next })
      .expect(401);
  });

  it("rejects a bad password with a generic error and no user enumeration", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ identifier: email, password: "wrong-password" })
      .expect(401);
    expect(res.body.error.message).toBe("Invalid credentials.");

    const unknown = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ identifier: "nobody@nexahaus.test", password: "whatever12345" })
      .expect(401);
    expect(unknown.body.error.message).toBe("Invalid credentials.");
  });
});
