import { createHash } from "node:crypto";
import path from "node:path";

import { hash } from "@node-rs/argon2";
import { config as loadEnv } from "dotenv";
import { CurrencyCode, InvoiceStatus, TAX_RATES, UserRole } from "@repo/contracts";
import { computeInvoiceTotals } from "@repo/common/money";

import { createPrismaClient } from "../src/index";

loadEnv({ path: path.resolve(__dirname, "../../../.env") });

const prisma = createPrismaClient(process.env.DATABASE_URL!);

// Deterministic id so every seeded row upserts instead of duplicating.
const keyedId = (key: string): string => {
  const hex = createHash("sha256").update(key).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(parseInt(hex.slice(16, 18), 16) & 0x3f | 0x80).toString(16)}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
};

// Deterministic PRNG so re-runs produce identical data.
const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rand = mulberry32(20260814);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number): number => min + rand() * (max - min);

const COMPANY_ID = keyedId("company:slm");
const ADMIN_ID = keyedId("user:admin");
const ACCOUNTANT_ID = keyedId("user:accountant");

const dateAt = (daysAgo: number, hour = 9): Date => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, Math.floor(rand() * 59), 0, 0);
  return d;
};

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

const customers = [
  { slug: "maju-jaya", name: "PT Maju Jaya", email: "hello@majujaya.co.id", phone: "+62 21 555 0134", taxId: "01.234.567.8-901.000", address: "Jl. Sudirman Kav. 52, Jakarta Selatan" },
  { slug: "sentosa-abadi", name: "CV Sentosa Abadi", email: "admin@sentosaabadi.com", phone: "+62 31 555 0887", taxId: "02.345.678.9-012.000", address: "Jl. Raya Darmo 88, Surabaya" },
  { slug: "berkah-makmur", name: "UD Berkah Makmur", email: "berkah@makmur.co.id", phone: "+62 22 555 1729", taxId: "03.456.789.0-123.000", address: "Jl. Braga 21, Bandung" },
  { slug: "nusantara-tek", name: "PT Nusantara Teknologi", email: "finance@nustek.id", phone: "+62 21 555 4021", taxId: "04.567.890.1-234.000", address: "Jl. Rasuna Said Kav. B-2, Jakarta Selatan" },
  { slug: "karya-mandiri", name: "CV Karya Mandiri", email: "info@karyamandiri.co.id", phone: "+62 361 555 660", taxId: "05.678.901.2-345.000", address: "Jl. Teuku Umar 45, Denpasar" },
  { slug: "sinar-kencana", name: "PT Sinar Kencana", email: "ap@sinarkencana.com", phone: "+62 24 555 8831", taxId: "06.789.012.3-456.000", address: "Jl. Pandanaran 110, Semarang" },
  { slug: "bumi-sejahtera", name: "PT Bumi Sejahtera", email: "keuangan@bumisejahtera.co.id", phone: "+62 21 555 9094", taxId: "07.890.123.4-567.000", address: "Jl. Thamrin 28, Jakarta Pusat" },
  { slug: "angkasa-raya", name: "CV Angkasa Raya", email: "contact@angkasaraya.com", phone: "+62 274 555 412", taxId: "08.901.234.5-678.000", address: "Jl. Malioboro 15, Yogyakarta" },
  { slug: "kopi-senja", name: "Warung Kopi Senja", email: null, phone: "+62 812 3456 7890", taxId: null, address: "Jl. Kayumanis 7, Jakarta Timur" },
  { slug: "studio-loka", name: "Studio Desain Loka", email: "loka@studio.id", phone: "+62 813 9876 5432", taxId: null, address: "Jl. Cihampelas 102, Bandung" },
  { slug: "elektronik-prima", name: "Toko Elektronik Prima", email: null, phone: "+62 811 2233 4455", taxId: null, address: "Jl. Ahmad Yani 300, Surabaya" },
  { slug: "bengkel-jaya", name: "Bengkel Motor Jaya", email: "bengkeljaya@gmail.com", phone: "+62 857 1122 3344", taxId: null, address: "Jl. Gajah Mada 61, Malang" },
] as const;

const itemsPool = [
  { description: "Konsultasi pengembangan perangkat lunak", unitPrice: 750000 },
  { description: "Perawatan server bulanan", unitPrice: 1500000 },
  { description: "Lisensi perangkat lunak (tahunan)", unitPrice: 8500000 },
  { description: "Perangkat keras — workstation", unitPrice: 24500000 },
  { description: "Pelatihan karyawan (per sesi)", unitPrice: 3500000 },
  { description: "Dukungan teknis (per jam)", unitPrice: 450000 },
  { description: "Instalasi jaringan", unitPrice: 9800000 },
  { description: "Penyimpanan cloud (per bulan)", unitPrice: 750000 },
  { description: "Kopi dan catering kantor", unitPrice: 1200000 },
  { description: "Meja dan kursi kantor", unitPrice: 6800000 },
  { description: "Desain logo dan brand", unitPrice: 6200000 },
  { description: "Perawatan AC gedung", unitPrice: 1800000 },
  { description: "Sewa ruang kerja bersama", unitPrice: 4200000 },
  { description: "Modul pelatihan digital", unitPrice: 2900000 },
] as const;

const TAX_VAT = TAX_RATES[1];
const TAX_NONE = TAX_RATES[0];

const invoiceItems = (): { description: string; quantity: string; unitPrice: string; taxRate: string }[] => {
  const count = 1 + Math.floor(rand() * 7);
  const used = new Set<number>();
  return Array.from({ length: count }, () => {
    let idx = Math.floor(rand() * itemsPool.length);
    while (used.has(idx)) {
      idx = Math.floor(rand() * itemsPool.length);
    }
    used.add(idx);
    const item = itemsPool[idx]!;
    return {
      description: item.description,
      quantity: (rand() < 0.3 ? between(1, 12) : 1).toFixed(4),
      unitPrice: item.unitPrice.toFixed(4),
      taxRate: rand() < 0.65 ? TAX_VAT : TAX_NONE,
    };
  });
};

async function main(): Promise<void> {
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: { name: "Sinergi Lintas Media" },
    create: { id: COMPANY_ID, name: "Sinergi Lintas Media" },
  });

  const users = [
    { id: ADMIN_ID, email: "admin@slm.local", name: "Admin SLM", role: UserRole.ADMIN },
    { id: ACCOUNTANT_ID, email: "accountant@slm.local", name: "Akuntan SLM", role: UserRole.ACCOUNTANT },
  ];
  const passwordHash = await hash("admin123");
  const passwordHashAccountant = await hash("accountant123");
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, role: user.role },
      create: {
        id: user.id,
        companyId: COMPANY_ID,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: user.id === ADMIN_ID ? passwordHash : passwordHashAccountant,
      },
    });
  }

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: keyedId(`customer:${customer.slug}`) },
      update: { name: customer.name },
      create: {
        id: keyedId(`customer:${customer.slug}`),
        companyId: COMPANY_ID,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        taxId: customer.taxId,
        address: customer.address,
      },
    });
  }

  // 7 months of history, 70 invoices total, spread across all statuses:
  // ~40% paid, ~25% sent (roughly half overdue), ~20% draft, ~15% cancelled.
  const plan: { paid: number; sent: number; cancelled: number; drafts: number }[] = [
    { paid: 6, sent: 1, cancelled: 1, drafts: 0 }, // 6 months ago
    { paid: 5, sent: 2, cancelled: 2, drafts: 0 },
    { paid: 5, sent: 2, cancelled: 1, drafts: 1 },
    { paid: 4, sent: 3, cancelled: 1, drafts: 2 },
    { paid: 3, sent: 4, cancelled: 2, drafts: 3 },
    { paid: 3, sent: 3, cancelled: 2, drafts: 4 },
    { paid: 2, sent: 3, cancelled: 1, drafts: 4 }, // current month
  ];

  let numberSequence = 1;
  const year = new Date().getFullYear();

  for (let monthIndex = 0; monthIndex < plan.length; monthIndex++) {
    const month = plan[monthIndex]!;
    const daysAgoOfMonthStart = (plan.length - 1 - monthIndex) * 30;
    const statuses: ("PAID" | "SENT" | "CANCELLED" | "DRAFT")[] = [
      ...Array(month.paid).fill("PAID"),
      ...Array(month.sent).fill("SENT"),
      ...Array(month.cancelled).fill("CANCELLED"),
      ...Array(month.drafts).fill("DRAFT"),
    ];
    // shuffle deterministically
    for (let i = statuses.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [statuses[i], statuses[j]] = [statuses[j]!, statuses[i]!];
    }

    for (const [position, status] of statuses.entries()) {
      const invoiceId = keyedId(`invoice:${monthIndex}:${position}`);
      const customer = customers[Math.floor(rand() * customers.length)]!;
      const issuedAt = dateAt(daysAgoOfMonthStart + between(2, 25));
      const dueDays = rand() < 0.5 ? 14 : 30;
      const dueDate = new Date(issuedAt.getTime() + dueDays * 24 * 60 * 60 * 1000);
      const items = invoiceItems();
      const totals = computeInvoiceTotals(items);

      const paid = status === "PAID";
      const cancelledAfterSend = status === "CANCELLED" && rand() < 0.5;
      const paidAt = paid ? new Date(issuedAt.getTime() + between(3, 20) * 24 * 60 * 60 * 1000) : null;

      const invoiceNumber =
        status === "DRAFT" ? null : `INV-${year}-${String(numberSequence++).padStart(4, "0")}`;

      const invoice = await prisma.invoice.upsert({
        where: { id: invoiceId },
        update: {
          customerId: keyedId(`customer:${customer.slug}`),
          status,
          number: invoiceNumber,
          issueDate: status === "DRAFT" ? null : issuedAt,
          dueDate,
          paidAt,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
        },
        create: {
          id: invoiceId,
          companyId: COMPANY_ID,
          customerId: keyedId(`customer:${customer.slug}`),
          createdById: ADMIN_ID,
          status,
          number: invoiceNumber,
          issueDate: status === "DRAFT" ? null : issuedAt,
          dueDate,
          paidAt,
          currency: CurrencyCode,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          items: {
            create: items.map((item, index) => ({
              position: index + 1,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
            })),
          },
        },
      });

      if (invoiceNumber && invoice.issueDate) {
        await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
        await prisma.invoiceItem.createMany({
          data: items.map((item, index) => ({
            invoiceId,
            position: index + 1,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          })),
        });
      }

      // Status history for non-draft invoices.
      if (status !== "DRAFT") {
        const history: { fromStatus: InvoiceStatus | null; toStatus: InvoiceStatus; at: Date }[] = [
          { fromStatus: InvoiceStatus.DRAFT, toStatus: InvoiceStatus.SENT, at: issuedAt },
        ];
        if (status === "PAID" && paidAt) {
          history.push({ fromStatus: InvoiceStatus.SENT, toStatus: InvoiceStatus.PAID, at: paidAt });
        }
        if (status === "CANCELLED") {
          const cancelledAt = new Date(issuedAt.getTime() + between(2, 10) * 24 * 60 * 60 * 1000);
          history.push({
            fromStatus: cancelledAfterSend ? InvoiceStatus.SENT : InvoiceStatus.DRAFT,
            toStatus: InvoiceStatus.CANCELLED,
            at: cancelledAt,
          });
        }
        for (const entry of history) {
          await prisma.invoiceStatusChange.upsert({
            where: { id: keyedId(`history:${invoiceId}:${entry.toStatus}`) },
            update: {},
            create: {
              id: keyedId(`history:${invoiceId}:${entry.toStatus}`),
              invoiceId,
              changedById: ADMIN_ID,
              fromStatus: entry.fromStatus,
              toStatus: entry.toStatus,
              at: entry.at,
            },
          });
        }
      }
    }
  }

  console.log("Seed complete: 1 company, 2 users, 12 customers, 70 invoices.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
