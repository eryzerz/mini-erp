import { Global, Injectable, Module, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
