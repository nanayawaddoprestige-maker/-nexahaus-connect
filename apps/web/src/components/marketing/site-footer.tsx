import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { footerNav } from "@/lib/routes";
import { COMPANY, CONTACT, PRE_LAUNCH_MODE, LAUNCH } from "@/lib/site-config";
import { ClientLoginLink } from "./client-login-link";
import { SocialLinks } from "./social-links";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const hasContact = CONTACT.email || CONTACT.phone || CONTACT.addressLine;

  return (
    <footer className="border-t border-line bg-navy-900 text-navy-200">
      <div className="nx-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-base font-semibold text-white">{COMPANY.shortName}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-navy-100">{COMPANY.tagline}</p>
          <p className="mt-4 text-xs leading-relaxed text-navy-300">
            {COMPANY.legalName}
            <br />
            {CONTACT.city}, {CONTACT.country}
            {CONTACT.addressLine ? (
              <>
                <br />
                {CONTACT.addressLine}
              </>
            ) : null}
          </p>
          {hasContact ? (
            <p className="mt-3 text-xs text-navy-300">
              {CONTACT.email ? (
                <a className="hover:text-white" href={`mailto:${CONTACT.email}`}>
                  {CONTACT.email}
                </a>
              ) : null}
              {CONTACT.email && CONTACT.phone ? <span aria-hidden> · </span> : null}
              {CONTACT.phone ? (
                <a className="hover:text-white" href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`}>
                  {CONTACT.phone}
                </a>
              ) : null}
            </p>
          ) : null}
          <SocialLinks className="mt-4" onNavy />
        </div>

        {footerNav.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-300">
              {group.heading}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-navy-100 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-navy-300">Access</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <ClientLoginLink className="px-0 py-0 text-navy-100 hover:text-white" />
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="nx-container flex flex-col gap-2 py-5 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {COMPANY.legalName}. All rights reserved.
          </p>
          <p>
            {PRE_LAUNCH_MODE
              ? `First office opening in ${LAUNCH.city}, ${LAUNCH.label}.`
              : `Operating from ${LAUNCH.city}, ${CONTACT.country}.`}{" "}
            NexaHaus does not provide legal, valuation, tax or investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
