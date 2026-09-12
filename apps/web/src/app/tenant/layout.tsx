"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isTenant, isStaff } from "@/lib/nav";
import { TenantShell } from "@/components/tenant-shell";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status, user } = useAuth();
  const tenant = isTenant(user);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && !tenant) {
      router.replace(isStaff(user) ? "/admin/dashboard" : "/dashboard");
    }
  }, [status, tenant, user, router]);

  if (status !== "authenticated" || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-subtle">
        Loading…
      </div>
    );
  }
  return <TenantShell>{children}</TenantShell>;
}
