import { Navbar } from "@/components/marketing/navbar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { AnalyticsProvider } from "@/components/marketing/analytics-provider";
import { CookieBanner } from "@/components/marketing/cookie-banner";
import { WhatsAppButton } from "@/components/marketing/whatsapp-button";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/marketing/jsonld";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <AnalyticsProvider />
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CookieBanner />
      <WhatsAppButton />
    </div>
  );
}
