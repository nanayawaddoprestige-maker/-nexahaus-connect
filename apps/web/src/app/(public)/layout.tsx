import Link from "next/link";
import { BrandMark } from "@/components/brand";

const NAV = [
  { href: "/property-management", label: "Property Management" },
  { href: "/asset-management", label: "Asset Management" },
  { href: "/diaspora", label: "Diaspora" },
  { href: "/about", label: "About" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
          <Link href="/welcome" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-navy-900">NexaHaus</p>
              <p className="text-[11px] text-ink-subtle">Properties &amp; Asset Management</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-ink-muted md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-navy-900">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 sm:block"
            >
              Client sign in
            </Link>
            <Link
              href="/health-check"
              className="rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-navy-800"
            >
              Property assessment
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-navy-900 text-navy-200">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <BrandMark className="h-7 w-7" />
              <span className="font-semibold text-white">NexaHaus</span>
            </div>
            <p className="mt-3 text-sm">Managing Properties. Maximizing Assets.</p>
            <p className="mt-4 text-xs text-navy-300">
              NexaHaus Properties &amp; Asset Management Ltd.
              <br />
              Accra, Ghana
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Services</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/property-management" className="hover:text-white">Property Management</Link></li>
              <li><Link href="/asset-management" className="hover:text-white">Asset Management</Link></li>
              <li><Link href="/property-rescue-service" className="hover:text-white">Property Rescue</Link></li>
              <li><Link href="/diaspora" className="hover:text-white">Diaspora owners</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Get started</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/health-check" className="hover:text-white">Property Health Check</Link></li>
              <li><Link href="/early-access" className="hover:text-white">Early Access</Link></li>
              <li><Link href="/about" className="hover:text-white">About NexaHaus</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-navy-300">
          © {new Date().getFullYear()} NexaHaus Properties &amp; Asset Management Ltd. NexaHaus does not
          provide legal, valuation, tax or investment advice.
        </div>
      </footer>
    </div>
  );
}
