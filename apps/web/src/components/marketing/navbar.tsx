"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { BrandMark } from "@/components/brand";
import { primaryNav, cta, routes } from "@/lib/routes";
import { COMPANY } from "@/lib/site-config";
import { MobileMenu } from "./mobile-menu";
import { ClientLoginLink } from "./client-login-link";
import { Cta } from "./cta";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-surface/90 backdrop-blur transition-shadow",
        scrolled ? "shadow-card" : "border-b border-line",
      )}
    >
      <div className="nx-container flex h-16 items-center justify-between gap-4">
        <Link
          href={routes.home}
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          aria-label={`${COMPANY.shortName} home`}
        >
          <BrandMark className="h-8 w-8" />
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-navy-900">
              {COMPANY.shortName}
            </span>
            <span className="block text-[11px] text-ink-subtle">
              Properties &amp; Asset Management
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== routes.home && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-navy-900"
                        : "text-ink-muted hover:text-navy-900",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <ClientLoginLink className="hidden text-navy-700 hover:bg-navy-50 sm:inline-flex" />
          <Cta
            href={cta.primary.href}
            size="md"
            className="hidden sm:inline-flex"
            eventProps={{ location: "header" }}
          >
            {cta.primary.label}
          </Cta>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
