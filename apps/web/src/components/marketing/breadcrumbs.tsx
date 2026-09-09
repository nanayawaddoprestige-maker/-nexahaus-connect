import Link from "next/link";
import { routes } from "@/lib/routes";
import { BreadcrumbJsonLd } from "./jsonld";

export interface Crumb {
  label: string;
  href: string;
}

/**
 * Visible breadcrumb trail + matching BreadcrumbList structured data. Always
 * starts at Home; pass the trail from the section root to the current page.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const full: Crumb[] = [{ label: "Home", href: routes.home }, ...trail];
  const last = full.length - 1;

  return (
    <>
      <BreadcrumbJsonLd trail={full.map((c) => [c.label, c.href])} />
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-ink-subtle">
          {full.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 ? <span aria-hidden>/</span> : null}
              {i === last ? (
                <span aria-current="page" className="font-medium text-navy-800">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-navy-900">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
