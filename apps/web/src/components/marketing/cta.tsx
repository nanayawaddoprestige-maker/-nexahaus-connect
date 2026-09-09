"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { track, type AnalyticsEvent } from "@/lib/analytics";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "onNavy";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy-900 text-white hover:bg-navy-800",
  secondary:
    "border border-line bg-surface text-navy-900 hover:bg-surface-sunken",
  ghost: "text-navy-800 hover:bg-navy-50",
  gold: "bg-gold-400 text-navy-900 hover:bg-gold-300",
  onNavy: "border border-white/25 text-white hover:bg-white/10",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export interface CtaProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Fired on click with `{ label, location }`. */
  event?: AnalyticsEvent;
  eventProps?: Record<string, string>;
  /** Analytics label; defaults to the visible text when it is a string. */
  label?: string;
}

/**
 * A call-to-action rendered as a link (navigations, not form submits). Every
 * click emits `cta_clicked` (or a supplied event) once analytics has consent.
 */
export function Cta({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  event = "cta_clicked",
  eventProps,
  label,
}: CtaProps) {
  const external = /^https?:\/\//.test(href);
  const resolvedLabel = label ?? (typeof children === "string" ? children : undefined);

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    variant === "onNavy"
      ? "focus-visible:ring-white focus-visible:ring-offset-navy-900"
      : "focus-visible:ring-navy-500 focus-visible:ring-offset-surface",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  const onClick = () =>
    track(event, { label: resolvedLabel, href, ...eventProps });

  if (external) {
    return (
      <a
        href={href}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={classes}>
      {children}
    </Link>
  );
}
