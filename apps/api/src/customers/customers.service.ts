import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CustomerDto } from "@repo/contracts";
import { paginate, PaginatedResult } from "@repo/common";
import { PrismaService } from "@repo/prisma";

import { CreateCustomerDto, ListCustomersQueryDto, UpdateCustomerDto } from "./customers.dto";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    address: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CustomerDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      taxId: customer.taxId,
      address: customer.address,
      notes: customer.notes,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  async findAll(
    companyId: string,
    query: ListCustomersQueryDto,
  ): Promise<PaginatedResult<CustomerDto>> {
    const where = {
      companyId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { email: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: query.sort === "name" ? { name: "asc" } : { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginate(customers.map((customer) => this.toDto(customer)), total, query.page, query.pageSize);
  }

  async findOne(companyId: string, id: string): Promise<CustomerDto> {
    const customer = await this.prisma.customer.findFirst({ where: { id, companyId } });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return this.toDto(customer);
  }

  async create(companyId: string, dto: CreateCustomerDto): Promise<CustomerDto> {
    const customer = await this.prisma.customer.create({
      data: {
        companyId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        taxId: dto.taxId ?? null,
        address: dto.address ?? null,
        notes: dto.notes ?? null,
      },
    });
    return this.toDto(customer);
  }

  async update(companyId: string, id: string, dto: UpdateCustomerDto): Promise<CustomerDto> {
    const existing = await this.prisma.customer.findFirst({ where: { id, companyId } });
    if (!existing) {
      throw new NotFoundException("Customer not found");
    }
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        taxId: dto.taxId ?? null,
        address: dto.address ?? null,
        notes: dto.notes ?? null,
      },
    });
    return this.toDto(customer);
  }

  async remove(companyId: string, id: string): Promise<{ success: true }> {
    const existing = await this.prisma.customer.findFirst({ where: { id, companyId } });
    if (!existing) {
      throw new NotFoundException("Customer not found");
    }
    const invoiceCount = await this.prisma.invoice.count({ where: { customerId: id } });
    if (invoiceCount > 0) {
      throw new ConflictException("Customer has invoices and cannot be deleted");
    }
    await this.prisma.customer.delete({ where: { id } });
    return { success: true };
  }
}
