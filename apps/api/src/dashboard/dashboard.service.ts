import { Injectable } from "@nestjs/common";
import type { DashboardSummary } from "@repo/contracts";
import { InvoiceStatus } from "@repo/contracts";
import { PrismaService } from "@repo/prisma";

import { DashboardQueryDto } from "./dashboard.dto";
import { moneyString, toInvoiceDto } from "../invoices/invoice.mapper";

interface DateWindow {
  issueDate?: { gte?: Date; lte?: Date };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(
    companyId: string,
    query: DashboardQueryDto,
  ): Promise<DashboardSummary> {
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const windowed = (issueDate: Date | undefined): DateWindow => ({
      ...(issueDate
        ? { issueDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    });

    const [paidAgg, sentAgg, overdueAgg, counts, recent, monthly] = await Promise.all([
      // Revenue: PAID invoices windowed by paidAt (flows window by when they happened).
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          status: InvoiceStatus.PAID,
          ...(from || to
            ? { paidAt: { not: null, ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
            : {}),
        },
        _sum: { total: true },
      }),
      // Outstanding: SENT invoices, windowed by issueDate (balances window by issue).
      this.prisma.invoice.aggregate({
        where: { ...windowed(from ?? to), status: InvoiceStatus.SENT },
        _sum: { total: true },
      }),
      // Overdue: SENT invoices past their due date.
      this.prisma.invoice.aggregate({
        where: { ...windowed(from ?? to), status: InvoiceStatus.SENT, dueDate: { lt: today } },
        _sum: { total: true },
      }),
      this.prisma.invoice.groupBy({
        by: ["status"],
        where: windowed(from ?? to),
        _count: { _all: true },
      }),
      this.prisma.invoice.findMany({
        where: windowed(from ?? to),
        include: { customer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Monthly revenue via SQL aggregation (date_trunc over the locked indexes).
      this.prisma.$queryRaw<{ month: string; revenue: string }[]>`
        SELECT to_char(date_trunc('month', "paidAt"), 'YYYY-MM') AS month,
               COALESCE(SUM("total"), 0)::text AS revenue
        FROM "Invoice"
        WHERE "companyId" = ${companyId}::uuid
          AND status = 'PAID'
          AND "paidAt" IS NOT NULL
          AND "paidAt" >= COALESCE(${from ?? null}::timestamptz, '-infinity'::timestamptz)
          AND "paidAt" <= COALESCE(${to ?? null}::timestamptz, 'infinity'::timestamptz)
        GROUP BY date_trunc('month', "paidAt")
        ORDER BY month ASC
      `,
    ]);

    const countsByStatus = {
      [InvoiceStatus.DRAFT]: 0,
      [InvoiceStatus.SENT]: 0,
      [InvoiceStatus.PAID]: 0,
      [InvoiceStatus.CANCELLED]: 0,
    };
    for (const row of counts) {
      countsByStatus[row.status] = row._count._all;
    }

    return {
      revenue: moneyString(paidAgg._sum.total ?? 0),
      outstanding: moneyString(sentAgg._sum.total ?? 0),
      overdue: moneyString(overdueAgg._sum.total ?? 0),
      countsByStatus,
      recentInvoices: recent.map(toInvoiceDto),
      monthlyRevenue: monthly.map((row) => ({ month: row.month, revenue: Number(row.revenue).toFixed(2) })),
    };
  }
}
