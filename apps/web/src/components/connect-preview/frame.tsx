import { cn } from "@/lib/cn";

/**
 * Product-window chrome for the NexaHaus Connect previews. Gives the panels the
 * feel of a real application surface without pretending to be a screenshot. Every
 * frame carries a visible "Illustrative interface" marker (brief §45).
 */
export function ConnectFrame({
  title,
  children,
  className,
  sidebar,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Optional left rail (module list). */
  sidebar?: React.ReactNode;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface shadow-raised",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-navy-900 px-4 py-2.5 text-white">
        <span aria-hidden className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </span>
        <span className="text-xs font-medium text-navy-100">{title}</span>
        <span className="ml-auto rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium text-navy-200">
          Illustrative interface
        </span>
      </div>
      <div className={cn("grid", sidebar ? "sm:grid-cols-[168px_1fr]" : "")}>
        {sidebar ? (
          <nav aria-hidden className="hidden border-r border-line bg-surface-sunken p-3 sm:block">
            {sidebar}
          </nav>
        ) : null}
        <div className="min-w-0 p-5">{children}</div>
      </div>
      <figcaption className="sr-only">
        Illustrative example of a NexaHaus Connect screen. All names, figures and
        activity are fictional and do not represent a real account.
      </figcaption>
    </figure>
  );
}

/** Module list for the frame sidebar. `active` highlights the current one. */
export function ModuleRail({ active }: { active: string }) {
  const items = [
    "Dashboard",
    "Properties",
    "Finance",
    "Maintenance",
    "Inspections",
    "Documents",
    "Approvals",
    "Reports",
    "Property Health",
  ];
  return (
    <ul className="space-y-0.5 text-xs">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "rounded-md px-2 py-1.5",
            item === active ? "bg-navy-900 font-medium text-white" : "text-ink-muted",
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Compact key/value row used across the panels. */
export function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "muted" | "positive" | "warning" | "critical";
}) {
  const valueCls =
    tone === "positive"
      ? "text-positive"
      : tone === "warning"
        ? "text-warning"
        : tone === "critical"
          ? "text-critical"
          : "text-navy-900";
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cn("font-medium tabular-nums", valueCls)}>{value}</dd>
    </div>
  );
}

const TONES = {
  neutral: "bg-navy-50 text-navy-700",
  positive: "bg-positive/10 text-positive",
  warning: "bg-warning/10 text-warning",
  critical: "bg-critical/10 text-critical",
} as const;

export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", TONES[tone])}>
      {children}
    </span>
  );
}
