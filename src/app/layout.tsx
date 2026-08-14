import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Public_Sans } from "next/font/google";

import "./globals.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/*
 * Three faces, three roles (07-DESIGN-SYSTEM.md §3). `next/font/google`
 * downloads at BUILD time and serves from our own origin — there is no runtime
 * Google Fonts request, which is what the "never a CDN link" rule is protecting
 * (CWV + privacy). Weights are pinned to only what the system actually uses;
 * every extra weight is bytes on the critical path.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"], // display: h1/h2 only
  variable: "--font-bricolage",
  display: "swap",
  preload: true,
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"], // body: prose and all UI chrome
  variable: "--font-public-sans",
  display: "swap",
  preload: true,
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"], // data: every number, date, code, ID
  variable: "--font-plex-mono",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jobpaper.com"),
  title: {
    default: "Free Trades Estimate, Invoice & Contract Builder — JobPaper",
    template: "%s · JobPaper",
  },
  description:
    "Price the job on a live takeoff sheet, then get a matching invoice and a contract carrying your state's required clauses. Free, no signup. Every number cited.",
  /*
   * The tab icon is src/app/icon.svg, picked up by the file convention.
   * The home-screen icon is declared by hand: iOS does not render SVG touch
   * icons at all, and Next 16's `apple-icon` file convention accepts only
   * .jpg/.jpeg/.png — so it is a 180×180 PNG of the same mark in public/.
   * Declaring `icons` replaces the auto-detected set, so the tab icon is
   * re-stated here rather than silently lost.
   */
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JobPaper",
  url: "https://jobpaper.com",
  description:
    "A free estimate, invoice and contract engine for solo and small-crew contractors. Deterministic pricing from versioned rules; state-aware contract clauses, each cited to its statute.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${publicSans.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <a
          href="#main"
          className="rounded-atlas focus:bg-ink focus:text-paper sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2"
        >
          Skip to the takeoff sheet
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
