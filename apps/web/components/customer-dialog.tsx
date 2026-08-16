"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, FormField, Input, Textarea } from "@repo/ui";
import type { CustomerDto } from "@repo/contracts";

import { useCreateCustomer, useUpdateCustomer } from "@/lib/queries";

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type CustomerValues = z.infer<typeof customerSchema>;

export const CustomerDialog = ({
  customer,
  trigger,
}: {
  customer?: CustomerDto;
  trigger: React.ReactNode;
}): React.ReactElement => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const form = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      taxId: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (customer) {
      form.reset({
        name: customer.name,
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        taxId: customer.taxId ?? "",
        address: customer.address ?? "",
        notes: customer.notes ?? "",
      });
    } else {
      form.reset({ name: "", email: "", phone: "", taxId: "", address: "", notes: "" });
    }
  }, [open, customer, form]);

  const submitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    const data = {
      name: values.name,
      ...(values.email ? { email: values.email } : {}),
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.taxId ? { taxId: values.taxId } : {}),
      ...(values.address ? { address: values.address } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    };
    try {
      if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, data });
        toast.success("Customer updated");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Customer created");
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save customer");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "New customer"}</DialogTitle>
          <DialogDescription>{customer ? "Update the customer's details." : "Add a customer to invoice."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField control={form.control} name="name" label="Name">
            {(field) => <Input id="name" placeholder="PT Maju Jaya" {...field} />}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="email" label="Email">
              {(field) => <Input id="email" type="email" placeholder="hello@company.id" {...field} />}
            </FormField>
            <FormField control={form.control} name="phone" label="Phone">
              {(field) => <Input id="phone" placeholder="+62 21 555 0134" {...field} />}
            </FormField>
          </div>
          <FormField control={form.control} name="taxId" label="Tax ID (NPWP)">
            {(field) => <Input id="taxId" placeholder="01.234.567.8-901.000" {...field} />}
          </FormField>
          <FormField control={form.control} name="address" label="Address">
            {(field) => <Textarea id="address" placeholder="Jl. Sudirman Kav. 52, Jakarta" {...field} />}
          </FormField>
          <FormField control={form.control} name="notes" label="Notes">
            {(field) => <Textarea id="notes" placeholder="Optional internal notes" {...field} />}
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Plus />}
              {customer ? "Save changes" : "Create customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
