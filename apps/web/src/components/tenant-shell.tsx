"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { BrandLockup } from "./brand";
import { Button } from "./ui/button";
import { NotificationBell } from "./notification-bell";

const NAV = [
  { href: "/tenant", label: "Home" },
  { href: "/tenant/lease", label: "My Lease" },
  { href: "/tenant/rent", label: "Rent" },
  { href: "/tenant/maintenance", label: "Maintenance" },
  { href: "/tenant/documents", label: "Documents" },
  { href: "/tenant/messages", label: "Messages" },
];

export function TenantShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="border-b border-line p-4">
          <BrandLockup subtle />
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
            Tenant portal
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/tenant"
                ? pathname === "/tenant"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-navy-900 text-white"
                    : "text-ink-muted hover:bg-navy-50 hover:text-navy-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-4">
          <p className="truncate text-sm font-medium text-navy-900">
            {user?.fullName}
          </p>
          <button
            onClick={() => void logout()}
            className="mt-1 text-xs text-ink-subtle hover:text-navy-900"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
          <BrandLockup subtle />
          <div className="flex items-center gap-2">
            <NotificationBell viewAllHref="/tenant/notifications" />
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="hidden items-center justify-end border-b border-line bg-surface px-8 py-2.5 lg:flex">
          <NotificationBell viewAllHref="/tenant/notifications" />
        </div>
        <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
