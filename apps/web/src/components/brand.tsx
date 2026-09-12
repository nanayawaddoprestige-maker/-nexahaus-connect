import { cn } from "@/lib/cn";

/**
 * NexaHaus wordmark — an abstract "N/H" gable in gold on navy. Every usage
 * pairs it with adjacent visible "NexaHaus" text, so it's decorative here
 * rather than separately labelled — a label on both would either repeat
 * ("NexaHaus NexaHaus...") or, worse, override the parent link's accessible
 * name so it no longer matches the visible text (WCAG 2.5.3).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" className="fill-navy-900" />
      <path
        d="M8 22V11l8-4 8 4v11"
        className="stroke-gold-400"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M12 22v-6h8v6"
        className="stroke-gold-400"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

export function BrandLockup({ subtle = false }: { subtle?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-tight">
        <p className="text-sm font-semibold text-navy-900">NexaHaus Connect</p>
        {!subtle ? (
          <p className="text-[11px] text-ink-subtle">
            Managing Properties. Maximizing Assets.
          </p>
        ) : null}
      </div>
    </div>
  );
}
