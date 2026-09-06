"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { homePathForUser } from "@/lib/nav";

export default function IndexPage() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.replace(homePathForUser(user));
    else if (status === "unauthenticated") router.replace("/welcome");
  }, [status, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-ink-subtle">
      Loading NexaHaus Connect…
    </div>
  );
}
