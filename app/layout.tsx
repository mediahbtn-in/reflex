import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import SmoothScroll from "@/components/ui/SmoothScroll";
import Cursor from "@/components/ui/Cursor";
import { SITE_URL, site } from "@/lib/site";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap", weight: ["200", "300", "400", "500", "600", "700", "800"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: site.title, template: "%s | Reflex Interior & Construction" },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: "A Reflex home at golden hour" }],
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description, images: ["/images/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#0B3158",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  name: site.name,
  slogan: site.tagline,
  description: site.description,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/reflex-logo.svg`,
  knowsAbout: ["Architecture", "Construction", "Interior design", "Renovation", "Turnkey projects"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SmoothScroll />
        <Cursor />
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
