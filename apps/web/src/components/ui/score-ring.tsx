import { cn } from "@/lib/cn";

/** A compact SVG score ring, 0–100. Colour bands: <60 critical, <80 warning, else positive. */
export function ScoreRing({
  score,
  size = 72,
  label,
}: {
  score: number | null;
  size?: number;
  label?: string;
}) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const stroke =
    score == null
      ? "var(--nx-line, #e5e7eb)"
      : pct < 60
        ? "#b91c1c"
        : pct < 80
          ? "#b45309"
          : "#0f766e";

  return (
    <div className="inline-flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Score ${score ?? "not scored"} of 100`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-navy-900 font-semibold"
          style={{ fontSize: size * 0.28 }}
        >
          {score ?? "—"}
        </text>
      </svg>
      {label ? (
        <span className="mt-1 text-xs text-ink-subtle">{label}</span>
      ) : null}
    </div>
  );
}

export function Bar({
  value,
  tone,
}: {
  value: number;
  tone?: "positive" | "warning" | "critical";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color =
    tone === "critical"
      ? "bg-critical"
      : tone === "warning"
        ? "bg-warning"
        : pct < 60
          ? "bg-critical"
          : pct < 80
            ? "bg-warning"
            : "bg-positive";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-50">
      <div
        className={cn("h-full rounded-full", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
