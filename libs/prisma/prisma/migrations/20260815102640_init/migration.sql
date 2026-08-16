-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "number" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "subtotal" DECIMAL(19,4) NOT NULL,
    "taxTotal" DECIMAL(19,4) NOT NULL,
    "total" DECIMAL(19,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitPrice" DECIMAL(19,4) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceStatusChange" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "fromStatus" "InvoiceStatus",
    "toStatus" "InvoiceStatus" NOT NULL,
    "changedById" UUID NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_companyId_status_idx" ON "Invoice"("companyId", "status");

-- CreateIndex
CREATE INDEX "Invoice_companyId_dueDate_idx" ON "Invoice"("companyId", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_companyId_createdAt_idx" ON "Invoice"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_companyId_number_key" ON "Invoice"("companyId", "number");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceStatusChange_invoiceId_idx" ON "InvoiceStatusChange"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceStatusChange" ADD CONSTRAINT "InvoiceStatusChange_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceStatusChange" ADD CONSTRAINT "InvoiceStatusChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
