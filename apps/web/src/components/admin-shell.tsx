"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { BrandMark } from "./brand";
import { Button } from "./ui/button";
import { NotificationBell } from "./notification-bell";

const NAV: { href: string; label: string }[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/leases", label: "Leases" },
  { href: "/admin/maintenance", label: "Maintenance" },
  { href: "/admin/inspections", label: "Inspections" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-navy-950/[0.02] lg:grid lg:grid-cols-[228px_1fr]">
      <aside className="hidden border-r border-line bg-navy-900 lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-white/10 p-4">
          <BrandMark className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">NexaHaus</p>
            <p className="text-[11px] text-navy-300">Staff console</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-navy-200 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
          <p className="truncate text-xs text-navy-300">
            {user?.roles.join(", ")}
          </p>
          <button
            onClick={() => void logout()}
            className="mt-2 text-xs text-navy-300 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-line bg-navy-900 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <span className="text-sm font-semibold text-white">Staff console</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="sm" className="text-navy-200" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="hidden items-center justify-end border-b border-line bg-surface px-8 py-2.5 lg:flex">
          <NotificationBell />
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
