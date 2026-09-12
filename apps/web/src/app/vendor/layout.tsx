"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isVendor, homePathForUser } from "@/lib/nav";
import { VendorShell } from "@/components/vendor-shell";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status, user } = useAuth();
  const vendor = isVendor(user);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && !vendor)
      router.replace(homePathForUser(user));
  }, [status, vendor, user, router]);

  if (status !== "authenticated" || !vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-subtle">
        Loading…
      </div>
    );
  }
  return <VendorShell>{children}</VendorShell>;
}
