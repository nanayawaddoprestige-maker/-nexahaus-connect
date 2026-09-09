import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Container } from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ManageCookiesButton } from "./manage-button";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description:
    "How the NexaHaus website uses cookies and similar technologies, and how to control them.",
  path: routes.cookies,
});

export default function CookiePolicyPage() {
  return (
    <div className="bg-surface">
      <Container className="py-10">
        <Breadcrumbs trail={[{ label: "Cookie Policy", href: routes.cookies }]} />
      </Container>
      <Container className="pb-20 pt-2">
        <h1 className="nx-display text-display-md text-navy-900">Cookie Policy</h1>
        <p className="mt-2 text-xs text-ink-subtle">
          Summary — a full policy will be published before launch.
        </p>

        <div className="nx-prose mt-6">
          <h2>What cookies are</h2>
          <p>
            Cookies are small files stored on your device. Similar technologies include
            local storage and session storage, which this site also uses. We group them
            into three categories.
          </p>

          <h2>Necessary</h2>
          <p>
            Required for the site to function — for example remembering your cookie choice,
            keeping a form&rsquo;s progress, and, in the client portal, keeping you signed
            in. These are always on and cannot be switched off.
          </p>

          <h2>Analytics</h2>
          <p>
            Optional. If you allow them, we use privacy-respecting analytics to understand
            which pages and resources are useful so we can improve them. No analytics
            provider is loaded until you have given permission. If no analytics provider is
            configured for this deployment, no analytics cookies are set at all.
          </p>

          <h2>Marketing</h2>
          <p>
            Optional. Used only to measure how our campaigns perform. We also record, in
            your browser&rsquo;s storage, which campaign first brought you to the site
            (for example a <code>utm_source</code> value) so that if you later submit a
            form we can attribute the enquiry correctly. This information is first-party,
            is not shared for advertising, and never appears in a URL.
          </p>

          <h2>Your choices</h2>
          <p>
            You choose your preferences the first time you visit, and you can change them
            at any time here:
          </p>
        </div>

        <div className="mt-4">
          <ManageCookiesButton />
        </div>

        <div className="nx-prose mt-8">
          <p>
            You can also block or delete cookies through your browser settings. Blocking
            necessary cookies may stop parts of the site working.
          </p>
          <p>
            Questions about cookies or your data can be raised through our{" "}
            <a href={routes.contact}>contact form</a>. See also our{" "}
            <a href={routes.privacy}>Privacy Policy</a>.
          </p>
        </div>
      </Container>
    </div>
  );
}
