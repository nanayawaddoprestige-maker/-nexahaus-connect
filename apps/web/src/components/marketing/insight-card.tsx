import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { InsightMeta } from "@/content/insights";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Editorial card for an Insights article. Used on the homepage teaser, the
 *  Insights listing and "related articles" blocks. */
export function InsightCard({
  article,
  className,
}: {
  article: InsightMeta;
  className?: string;
}) {
  const href = `${routes.insights}/${article.slug}`;
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-shadow hover:shadow-raised",
        className,
      )}
    >
      <Link href={href} className="block" aria-label={article.title}>
        <div className="relative aspect-[16/9] bg-navy-50">
          {article.heroImage ? (
            <Image
              src={article.heroImage}
              alt={article.heroAlt ?? ""}
              fill
              sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs font-medium uppercase tracking-wide text-navy-300">
              {article.category}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
          {article.category}
        </p>
        <h3 className="mt-2 text-base font-semibold leading-snug text-navy-900">
          <Link href={href} className="hover:text-navy-700">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-ink-muted">
          {article.description}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-ink-subtle">
          <time dateTime={article.publishedAt}>
            {DATE_FMT.format(new Date(article.publishedAt))}
          </time>
          {article.readingMinutes ? (
            <>
              <span aria-hidden>·</span>
              <span>{article.readingMinutes} min read</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
