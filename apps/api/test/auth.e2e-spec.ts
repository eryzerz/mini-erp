import { execSync } from "node:child_process";
import path from "node:path";

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { hash } from "@node-rs/argon2";
import { UserRole } from "@repo/contracts";
import { createPrismaClient } from "@repo/prisma";
import type { PrismaClient } from "@repo/prisma";
import request from "supertest";

import { AppModule } from "../src/app.module";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const testUrl = process.env.DATABASE_URL_TEST!;
  const admin = { email: "e2e-admin@slm.local", password: "e2e-password" };

  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl;
    execSync(`DATABASE_URL=${testUrl} pnpm --dir ${path.resolve(__dirname, "../../../libs/prisma")} exec prisma migrate deploy`, {
      stdio: "pipe",
    });

    prisma = createPrismaClient(testUrl);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "InvoiceItem", "InvoiceStatusChange", "RefreshToken", "Invoice", "Customer", "User", "Company" CASCADE`);

    const company = await prisma.company.create({ data: { name: "E2E Company" } });
    await prisma.user.create({
      data: {
        companyId: company.id,
        email: admin.email,
        name: "E2E Admin",
        role: UserRole.ADMIN,
        passwordHash: await hash(admin.password),
      },
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it("rejects a wrong password", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: admin.email, password: "wrong-password" })
      .expect(401);
  });

  it("logs in, reads /me, rotates a refresh token, and revokes on logout", async () => {
    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: admin.email, password: admin.password })
      .expect(201);

    const { accessToken, refreshToken, user } = login.body;
    expect(user.email).toBe(admin.email);
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => expect(res.body.email).toBe(admin.email));

    const rotated = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(201);
    expect(rotated.body.accessToken).toBeDefined();
    expect(rotated.body.refreshToken).toBeDefined();

    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${rotated.body.accessToken}`)
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(201);

    // The rotated token was revoked by logout: reuse must fail.
    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
  });

  it("rejects requests without a token", async () => {
    await request(app.getHttpServer()).get("/api/v1/auth/me").expect(401);
  });
});
