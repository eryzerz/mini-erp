"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage(): React.ReactElement {
  const { user, login } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(values.email, values.password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            SLM <span className="text-primary">ERP</span>
          </CardTitle>
          <CardDescription>Sign in to the invoicing system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@slm.local" autoComplete="email" {...register("email")} />
              {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
              {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
