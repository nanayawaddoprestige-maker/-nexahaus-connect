"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { primaryNav, cta } from "@/lib/routes";
import { ClientLoginLink } from "./client-login-link";
import { Cta } from "./cta";

/**
 * Accessible slide-over navigation for < lg. Focus is trapped while open, Esc
 * closes, body scroll is locked, and the menu closes on route change.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(
      () => panelRef.current?.querySelector<HTMLElement>("a,button")?.focus(),
      50,
    );
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Site menu">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm animate-fade-in"
          />
          <div
            ref={panelRef}
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-surface shadow-raised animate-fade-up"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-sm font-semibold text-navy-900">Menu</span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {primaryNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-lg px-3 py-3 text-[15px] font-medium",
                      active ? "bg-navy-50 text-navy-900" : "text-ink-muted hover:bg-surface-sunken hover:text-navy-900",
                    )}
                  >
                    {item.label}
                    {item.description ? (
                      <span className="mt-0.5 block text-xs font-normal text-ink-subtle">
                        {item.description}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-2 border-t border-line px-5 py-4">
              <Cta href={cta.primary.href} variant="primary" className="w-full" event="cta_clicked" eventProps={{ location: "mobile_menu" }}>
                {cta.primary.label}
              </Cta>
              <Cta href={cta.secondary.href} variant="secondary" className="w-full" eventProps={{ location: "mobile_menu" }}>
                {cta.secondary.label}
              </Cta>
              <ClientLoginLink className="w-full justify-center border border-line text-navy-800 hover:bg-surface-sunken" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
