import { BadRequestException } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { JwtAuthGuard, RolesGuard } from "@repo/common";
import { PrismaModule } from "@repo/prisma";

import { AllExceptionsFilter } from "./common/all-exceptions.filter";

import { AuthModule } from "./auth/auth.module";
import { CustomersModule } from "./customers/customers.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { HealthModule } from "./health/health.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_ACCESS_SECRET") ?? "dev-secret",
        signOptions: { expiresIn: "15m" },
      }),
    }),
    // Generous global default — real rate limiting applies only where @Throttle
    // decorators opt in (the login and refresh routes).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    InvoicesModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {
  constructor(config: ConfigService) {
    const required = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
    const missing = required.filter((key) => !config.get<string>(key));
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required env vars: ${missing.join(", ")}`);
    }
  }
}
