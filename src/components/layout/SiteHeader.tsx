import Link from "next/link";

import { Logo } from "./Logo";

/**
 * Header: the mark, then the five destinations. No tagline banner, no hero
 * chrome — the tool starts immediately below this line, which is the whole
 * argument of the design system (§1: the hero is data, not a headline).
 *
 * Marked `no-print`: the sheet on screen is the document, and the document
 * does not carry site navigation.
 */

const nav = [
  { href: "/", label: "Estimate" },
  { href: "/contracts/CA", label: "Contracts" },
  // Short labels: five destinations have to fit one row at 375px, above a
  // tool that is the reason anyone is here. The full name is in the footer.
  { href: "/pricing-methodology", label: "Pricing" },
  { href: "/sources", label: "Sources" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="no-print border-rule bg-paper border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1">
        <Logo />
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.9rem]">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-dim hover:text-ink inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
