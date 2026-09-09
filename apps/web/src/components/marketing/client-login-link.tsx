"use client";

import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";
import { CLIENT_PORTAL_URL } from "@/lib/site-config";

/**
 * "Client Login" — points at NexaHaus Connect (NEXT_PUBLIC_CLIENT_PORTAL_URL,
 * default /login). Emits `client_login_clicked`.
 */
export function ClientLoginLink({
  className,
  children = "Client Login",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const external = /^https?:\/\//.test(CLIENT_PORTAL_URL);
  return (
    <a
      href={CLIENT_PORTAL_URL}
      onClick={() => track("client_login_clicked", { href: CLIENT_PORTAL_URL })}
      {...(external ? { rel: "noopener noreferrer" } : {})}
      className={cn(
        "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        className,
      )}
    >
      {children}
    </a>
  );
}
