"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button, Card, CardContent, CardHeader, CardTitle, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui";
import type { InvoiceDto } from "@repo/contracts";

import { AmountText } from "@/components/amount-text";
import { useCreateInvoice, useCustomers, useUpdateInvoice } from "@/lib/queries";

const itemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.string().regex(/^\d+(\.\d+)?$/, "Must be a number"),
  unitPrice: z.string().regex(/^\d+(\.\d+)?$/, "Must be a number"),
  taxRate: z.enum(["0.00", "11.00"]),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  dueDate: z.string().min(1, "Required"),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type InvoiceValues = z.infer<typeof invoiceSchema>;

export const InvoiceForm = ({ invoice }: { invoice?: InvoiceDto }): React.ReactElement => {
  const router = useRouter();
  const { data: customers } = useCustomers({ pageSize: 100 });
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: "",
      dueDate: "",
      items: [{ description: "", quantity: "1", unitPrice: "", taxRate: "11.00" }],
    },
  });

  useEffect(() => {
    if (!invoice) return;
    form.reset({
      customerId: invoice.customerId,
      dueDate: invoice.dueDate,
      items: (invoice.items ?? []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: (item.taxRate === "11.00" ? "11.00" : "0.00") as "11.00" | "0.00",
      })),
    });
  }, [invoice, form]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const items = form.watch("items");

  const totals = items.reduce(
    (acc, item) => {
      const valid = item.quantity !== "" && item.unitPrice !== "";
      if (!valid) return acc;
      const subtotal = Number(item.quantity) * Number(item.unitPrice);
      const tax = subtotal * (Number(item.taxRate) / 100);
      return { subtotal: acc.subtotal + subtotal, tax: acc.tax + tax };
    },
    { subtotal: 0, tax: 0 },
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        customerId: values.customerId,
        dueDate: values.dueDate,
        items: values.items.map((item) => ({ ...item })),
      };
      if (invoice) {
        await updateMutation.mutateAsync({ id: invoice.id, data: payload });
        toast.success("Draft updated");
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Draft invoice created");
        router.push(`/invoices/${created.id}`);
        return;
      }
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField<InvoiceValues, string> control={form.control} name="customerId" label="Customer">
            {(field) => (
              <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {(customers?.items ?? []).map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField<InvoiceValues, string> control={form.control} name="dueDate" label="Due date">
            {(field) => <Input id="dueDate" type="date" {...field} />}
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: "1", unitPrice: "", taxRate: "11.00" })}>
            <Plus /> Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-28">Unit price</TableHead>
                <TableHead className="w-24">PPN</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField<InvoiceValues, string> control={form.control} name={`items.${index}.description`}>
                      {(input) => <Input placeholder="Service or product" {...input} />}
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField<InvoiceValues, string> control={form.control} name={`items.${index}.quantity`}>
                      {(input) => <Input {...input} />}
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField<InvoiceValues, string> control={form.control} name={`items.${index}.unitPrice`}>
                      {(input) => <Input placeholder="0" {...input} />}
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <FormField<InvoiceValues, string> control={form.control} name={`items.${index}.taxRate`}>
                      {(input) => (
                        <Select value={input.value} onValueChange={(value) => input.onChange(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.00">0%</SelectItem>
                            <SelectItem value="11.00">11%</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </FormField>
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove item" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {form.formState.errors.items ? (
            <p className="text-xs text-destructive">{String(form.formState.errors.items.message ?? "Fix the items above")}</p>
          ) : null}

          <div className="ml-auto w-full max-w-xs space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <AmountText value={totals.subtotal.toFixed(2)} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (PPN)</span>
              <AmountText value={totals.tax.toFixed(2)} />
            </div>
            <div className="flex justify-between border-t pt-1 text-base font-semibold">
              <span>Total</span>
              <AmountText value={(totals.subtotal + totals.tax).toFixed(2)} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push(invoice ? `/invoices/${invoice.id}` : "/invoices")}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              {invoice ? "Save changes" : "Save draft"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
