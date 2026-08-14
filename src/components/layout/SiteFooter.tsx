import Link from "next/link";

import { STATE_IDS, STATE_RULES, TRADE_IDS, TRADE_RULES } from "@engine";

import { formatDate } from "@/lib/format";

/**
 * Footer: the verification date first, the trust pages second, the standing
 * caveat last. The date is read out of the rules files themselves — a
 * hand-typed freshness date is the one that goes stale silently.
 */

const trustLinks = [
  { href: "/pricing-methodology", label: "Pricing methodology" },
  { href: "/sources", label: "Sources" },
  { href: "/editorial-policy", label: "Editorial policy" },
  { href: "/changelog", label: "Changelog" },
  { href: "/about", label: "About" },
] as const;

export function SiteFooter() {
  const dates = [
    ...TRADE_IDS.flatMap((t) => TRADE_RULES[t].citations.map((c) => c.lastVerified)),
    ...STATE_IDS.flatMap((s) => STATE_RULES[s].citations.map((c) => c.lastVerified)),
  ].sort();
  const lastVerified = dates[dates.length - 1] ?? "";

  return (
    <footer className="no-print border-rule mt-16 border-t">
      <div className="text-dim mx-auto max-w-6xl space-y-3 px-4 py-6 text-[0.85rem]">
        <p>
          Rules verified{" "}
          <time className="num text-ink" dateTime={lastVerified}>
            {formatDate(lastVerified)}
          </time>{" "}
          ·{" "}
          <Link
            href="/pricing-methodology"
            className="hover:text-ink underline underline-offset-4"
          >
            How every number is computed →
          </Link>
        </p>

        <nav aria-label="Trust pages">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {trustLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:text-ink inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p style={{ maxWidth: "var(--measure)" }}>
          JobPaper builds document templates from versioned, cited rule data. It is a
          template, not legal advice — have an attorney review any contract before you
          sign it. v1 prices are placeholder reference data pending a licensed cost
          source; check them against your own suppliers. Your job data stays in your
          browser.
        </p>
      </div>
    </footer>
  );
}
