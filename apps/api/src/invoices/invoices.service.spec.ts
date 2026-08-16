import { ConflictException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { InvoiceStatus } from "@repo/contracts";
import { PrismaService } from "@repo/prisma";

import { InvoicesService } from "./invoices.service";

describe("InvoicesService (lifecycle)", () => {
  let service: InvoicesService;
  let prisma: {
    invoice: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    invoiceItem: { deleteMany: jest.Mock; createMany: jest.Mock };
    invoiceStatusChange: { create: jest.Mock };
    customer: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };

  const actor = { companyId: "company-1", sub: "user-1" };
  const draftInvoice = {
    id: "inv-1",
    companyId: "company-1",
    customerId: "cust-1",
    status: InvoiceStatus.DRAFT,
    number: null,
    issueDate: null,
    dueDate: new Date("2026-09-15"),
    paidAt: null,
    currency: "IDR",
    subtotal: 1000,
    taxTotal: 110,
    total: 1110,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const sentInvoice = { ...draftInvoice, status: InvoiceStatus.SENT, number: "INV-2026-0001", issueDate: new Date() };
  const paidInvoice = { ...sentInvoice, status: InvoiceStatus.PAID, paidAt: new Date() };


  beforeEach(async () => {
    prisma = {
      invoice: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      invoiceItem: { deleteMany: jest.fn(), createMany: jest.fn() },
      invoiceStatusChange: { create: jest.fn() },
      customer: { findFirst: jest.fn() },
      $transaction: jest.fn((fn: (client: unknown) => unknown) => fn(tx)),
    };

    const tx = {
      invoice: prisma.invoice,
      invoiceItem: prisma.invoiceItem,
      invoiceStatusChange: prisma.invoiceStatusChange,
    };

    const module = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(InvoicesService);
  });

  describe("send", () => {
    it("assigns the next number, sets the issue date, and records history", async () => {
      prisma.invoice.findFirst.mockResolvedValue(draftInvoice);
      prisma.invoice.findMany.mockResolvedValue([{ number: "INV-2026-0001" }]);
      prisma.invoice.update.mockResolvedValue({
        ...draftInvoice,
        status: InvoiceStatus.SENT,
        number: "INV-2026-0002",
        issueDate: new Date("2026-08-15"),
        customer: { id: "cust-1", name: "PT Maju Jaya" },
      });

      const result = await service.send(actor, "inv-1");

      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ number: "INV-2026-0002" }),
        }),
      );
      expect(prisma.invoiceStatusChange.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromStatus: InvoiceStatus.DRAFT,
          toStatus: InvoiceStatus.SENT,
        }),
      });
      expect(result.status).toBe(InvoiceStatus.SENT);
      expect(result.number).toBe("INV-2026-0002");
    });

    it("rejects sending a non-draft invoice", async () => {
      prisma.invoice.findFirst.mockResolvedValue(paidInvoice);

      await expect(service.send(actor, "inv-1")).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });
  });

  describe("markPaid", () => {
    it("marks a sent invoice paid and records history", async () => {
      prisma.invoice.findFirst.mockResolvedValue(sentInvoice);
      prisma.invoice.update.mockResolvedValue({
        ...sentInvoice,
        status: InvoiceStatus.PAID,
        paidAt: new Date("2026-08-15T10:00:00Z"),
        customer: { id: "cust-1", name: "PT Maju Jaya" },
      });

      const result = await service.markPaid(actor, "inv-1");

      expect(prisma.invoiceStatusChange.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromStatus: InvoiceStatus.SENT,
          toStatus: InvoiceStatus.PAID,
        }),
      });
      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paidAt).not.toBeNull();
    });

    it("rejects marking a draft paid", async () => {
      prisma.invoice.findFirst.mockResolvedValue(draftInvoice);

      await expect(service.markPaid(actor, "inv-1")).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("cancel", () => {
    it("cancels a draft", async () => {
      prisma.invoice.findFirst.mockResolvedValue(draftInvoice);
      prisma.invoice.update.mockResolvedValue({
        ...draftInvoice,
        status: InvoiceStatus.CANCELLED,
        customer: { id: "cust-1", name: "PT Maju Jaya" },
      });

      const result = await service.cancel(actor, "inv-1");

      expect(prisma.invoiceStatusChange.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ toStatus: InvoiceStatus.CANCELLED }),
      });
      expect(result.status).toBe(InvoiceStatus.CANCELLED);
    });

    it("cancels a sent invoice", async () => {
      prisma.invoice.findFirst.mockResolvedValue(sentInvoice);
      prisma.invoice.update.mockResolvedValue({
        ...sentInvoice,
        status: InvoiceStatus.CANCELLED,
        customer: { id: "cust-1", name: "PT Maju Jaya" },
      });

      await expect(service.cancel(actor, "inv-1")).resolves.toMatchObject({
        status: InvoiceStatus.CANCELLED,
      });
    });

    it("rejects cancelling a paid invoice", async () => {
      prisma.invoice.findFirst.mockResolvedValue(paidInvoice);

      await expect(service.cancel(actor, "inv-1")).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("remove", () => {
    it("deletes a draft", async () => {
      prisma.invoice.findFirst.mockResolvedValue(draftInvoice);
      prisma.invoice.delete.mockResolvedValue(draftInvoice);

      await expect(service.remove(actor, "inv-1")).resolves.toEqual({ success: true });
      expect(prisma.invoice.delete).toHaveBeenCalledWith({ where: { id: "inv-1" } });
    });

    it("rejects deleting a sent invoice", async () => {
      prisma.invoice.findFirst.mockResolvedValue(sentInvoice);

      await expect(service.remove(actor, "inv-1")).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
