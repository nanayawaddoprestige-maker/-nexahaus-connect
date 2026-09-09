"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { FaqItem } from "@/content/faq";

/**
 * Accessible disclosure list. One panel open at a time by default; each header
 * is a real <button> with `aria-expanded` / `aria-controls`. The matching
 * FAQPage structured data is emitted by <FaqJsonLd> (rendered separately by the
 * page so it can live in <head> order).
 */
export function FaqAccordion({
  items,
  allowMultiple = false,
  className,
}: {
  items: FaqItem[];
  allowMultiple?: boolean;
  className?: string;
}) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <ul className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const btnId = `${baseId}-b-${i}`;
        const panelId = `${baseId}-p-${i}`;
        return (
          <li key={item.question}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="flex w-full items-start justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
              >
                <span className="text-[15px] font-semibold text-navy-900">{item.question}</span>
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 shrink-0 text-ink-subtle transition-transform",
                    isOpen && "rotate-45",
                  )}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="pb-5 pr-8 text-sm leading-relaxed text-ink-muted"
            >
              {item.answer}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }),
      }}
    />
  );
}
