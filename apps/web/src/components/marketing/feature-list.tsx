import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

export interface Feature {
  title: string;
  body: string;
}

/** A responsive grid of titled feature cards, revealed on scroll. */
export function FeatureList({
  features,
  columns = 2,
  className,
}: {
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-4", cols, className)}>
      {features.map((f, i) => (
        <Reveal key={f.title} delay={i * 40}>
          <div className="flex h-full flex-col rounded-xl border border-line bg-surface p-6 shadow-card">
            <h3 className="text-sm font-semibold text-navy-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/** Compact bulleted list with gold dots — for "what's included" style content. */
export function CheckList({
  items,
  columns = 1,
  className,
}: {
  items: string[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" }[columns];
  return (
    <ul className={cn("grid gap-x-6 gap-y-2 text-sm text-ink-muted", cols, className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
          {item}
        </li>
      ))}
    </ul>
  );
}
