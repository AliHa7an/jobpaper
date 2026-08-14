import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JobPaper — Estimate, Invoice & Contract Builder for Trades",
    template: "%s · JobPaper",
  },
  description:
    "Build an itemized estimate, a matching invoice, and a state-aware contract template in five minutes. Free, no signup. Placeholder pricing clearly labeled.",
};

const NAV = [
  { href: "/", label: "Estimate" },
  { href: "/invoice", label: "Invoice" },
  { href: "/contract", label: "Contract" },
  { href: "/pricing-methodology", label: "Pricing methodology" },
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${publicSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="no-print border-b border-rule bg-sheet">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3"
          >
            <Link href="/" className="flex items-center py-2 text-lg font-bold text-ink">
              JobPaper
            </Link>
            <span className="hidden text-sm text-dim sm:inline">
              Quote it right. Paper it right. Get paid.
            </span>
            <div className="ms-auto flex flex-wrap items-center gap-x-5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center py-2 text-sm font-medium text-signal underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

        <footer className="no-print border-t border-rule bg-sheet">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-dim">
            <p className="mb-3 max-w-3xl">
              JobPaper generates document templates from versioned, cited rule data. It is
              not legal advice, and v1 pricing is placeholder reference data — have an
              attorney review contracts and check prices against your local suppliers.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {[
                ["/pricing-methodology", "Pricing methodology"],
                ["/sources", "Sources"],
                ["/editorial-policy", "Editorial policy"],
                ["/changelog", "Changelog"],
                ["/about", "About"],
                ["/contracts/CA", "State contract rules"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href as "/about"}
                    className="flex items-center py-2 underline-offset-4 hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
