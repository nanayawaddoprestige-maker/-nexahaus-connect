"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isStaff } from "@/lib/nav";
import { AdminShell } from "@/components/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status, user } = useAuth();
  const staff = isStaff(user);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && !staff) router.replace("/dashboard");
  }, [status, staff, router]);

  if (status !== "authenticated" || !staff) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-subtle">
        Loading…
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
