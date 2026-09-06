import type { ReactNode } from "react";
import { formatDate } from "@/lib/format";

export function Timeline({
  entries,
}: {
  entries: { title: ReactNode; detail?: ReactNode; at: string }[];
}) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {entries.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-navy-900" />
          <p className="text-sm font-medium text-navy-900">{e.title}</p>
          {e.detail ? <p className="text-sm text-ink-muted">{e.detail}</p> : null}
          <p className="mt-0.5 text-xs text-ink-subtle">{formatDate(e.at)}</p>
        </li>
      ))}
    </ol>
  );
}
