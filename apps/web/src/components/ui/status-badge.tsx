import { cn } from "@/lib/cn";
import { titleCase } from "@/lib/format";

type Tone = "neutral" | "positive" | "warning" | "critical" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-navy-50 text-navy-700 ring-navy-100",
  positive: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  warning: "bg-amber-50 text-amber-800 ring-amber-100",
  critical: "bg-red-50 text-red-800 ring-red-100",
  info: "bg-sky-50 text-sky-800 ring-sky-100",
};

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "positive",
  OCCUPIED: "positive",
  PAID: "positive",
  COMPLETED: "positive",
  VERIFIED: "positive",
  REPORT_ISSUED: "positive",
  VACANT: "warning",
  RESERVED: "info",
  PARTIALLY_PAID: "warning",
  EXPIRING: "warning",
  AWAITING_APPROVAL: "warning",
  SCHEDULED: "info",
  IN_PROGRESS: "info",
  UNDER_MAINTENANCE: "warning",
  UNDER_RENOVATION: "warning",
  OVERDUE: "critical",
  URGENT: "critical",
  SUSPENDED: "critical",
  TERMINATED: "critical",
  CANCELLED: "neutral",
  ARCHIVED: "neutral",
  SOLD: "neutral",
  DRAFT: "neutral",
};

export function StatusBadge({
  status,
  tone,
  className,
}: {
  status: string;
  tone?: Tone;
  className?: string;
}) {
  const resolved = tone ?? STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASS[resolved],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-emerald-500": resolved === "positive",
          "bg-amber-500": resolved === "warning",
          "bg-red-500": resolved === "critical",
          "bg-sky-500": resolved === "info",
          "bg-navy-400": resolved === "neutral",
        })}
      />
      {titleCase(status)}
    </span>
  );
}
