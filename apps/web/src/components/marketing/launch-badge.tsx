import { cn } from "@/lib/cn";
import { PRE_LAUNCH_MODE, LAUNCH } from "@/lib/site-config";

/**
 * Pre-launch status pill. Framed as momentum, not absence (brief §6): "Building
 * now. Launching in Accra December 2027." After launch it switches to an
 * operating statement. Purely presentational.
 */
export function LaunchBadge({
  onNavy = false,
  className,
}: {
  onNavy?: boolean;
  className?: string;
}) {
  const text = PRE_LAUNCH_MODE
    ? `Building now · Launching in ${LAUNCH.city} ${LAUNCH.label}`
    : `Now serving property owners from ${LAUNCH.city}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        onNavy
          ? "border-white/20 bg-white/5 text-navy-100"
          : "border-line bg-surface text-ink-muted",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          onNavy ? "bg-gold-400" : "bg-gold-500",
        )}
      />
      {text}
    </span>
  );
}
