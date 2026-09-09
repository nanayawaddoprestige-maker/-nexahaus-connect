import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { fontClass } from "@/lib/fonts";
import { SITE_URL, COMPANY } from "@/lib/site-config";
import { TITLE_TEMPLATE } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${COMPANY.shortName} — Property & Asset Management in Ghana`,
    template: TITLE_TEMPLATE,
  },
  description: COMPANY.description,
  applicationName: COMPANY.product,
  authors: [{ name: COMPANY.legalName }],
  openGraph: {
    type: "website",
    siteName: COMPANY.shortName,
    locale: "en_GH",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#0a1f44",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontClass}>
      <body className="font-sans">
        <a href="#main" className="nx-skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
