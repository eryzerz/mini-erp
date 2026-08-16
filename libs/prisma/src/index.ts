import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

export type { PrismaClient } from "./generated/prisma/client";
export * from "./generated/prisma/client";
export { PrismaModule, PrismaService } from "./prisma-service";

let cached: PrismaClient | null = null;

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export function prisma(): PrismaClient {
  if (!cached) {
    cached = createPrismaClient(process.env.DATABASE_URL!);
  }
  return cached;
}
