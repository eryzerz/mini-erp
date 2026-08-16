"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";

import { useSession } from "@/lib/session";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/invoices", label: "Invoices" },
];

const initials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const AppShell = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r bg-card md:block">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            SLM <span className="text-primary">ERP</span>
          </Link>
        </div>
        {nav}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 border-r bg-card">
            <div className="flex h-14 items-center border-b px-4">
              <span className="text-sm font-semibold tracking-tight">
                SLM <span className="text-primary">ERP</span>
              </span>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
          <button className="rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="hidden text-sm text-muted-foreground md:block">Mini ERP Invoicing System</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 hover:bg-accent" aria-label="User menu">
                  <Avatar>
                    <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-medium leading-tight">{user?.name}</p>
                    <Badge variant={user?.role === "ADMIN" ? "default" : "secondary"} className="mt-0.5 h-4 px-1.5 text-[10px]">
                      {user?.role}
                    </Badge>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void logout()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};
