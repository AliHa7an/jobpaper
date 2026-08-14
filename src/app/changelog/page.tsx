import type { Metadata } from "next";
import Link from "next/link";

import { STATE_IDS, STATE_RULES, TRADE_IDS, TRADE_RULES } from "@engine";

import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Changelog — Dated, Cited Rule Changes",
  description:
    "Every change to JobPaper's pricing and state contract rulesets, dated and cited.",
};

export default function ChangelogPage() {
  const launched = TRADE_RULES.decks.effectiveFrom;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1>Changelog</h1>
      <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
        Rule changes land here within 48 hours, with the ruleset version and the citation.
        The full citation list is on{" "}
        <Link href="/sources" className="underline underline-offset-4">
          sources
        </Link>
        .
      </p>

      <section
        className="hairline-all rounded-atlas p-4"
        style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper-raised)" }}
      >
        <p className="micro-label">
          <time className="num" dateTime={launched}>
            {formatDate(launched)}
          </time>
        </p>
        <h2>v1 launch rulesets</h2>
        <ul className="mt-2 ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
          <li>
            Pricing rulesets published for{" "}
            {TRADE_IDS.map((t) => TRADE_RULES[t].label.toLowerCase()).join(", ")} —{" "}
            {TRADE_IDS.map((t) => (
              <span key={t} className="num">
                {TRADE_RULES[t].ruleSetVersion}{" "}
              </span>
            ))}
            . All pricing is placeholder reference data pending licensed cost data and
            contractor review; estimates carry the warning until re-verified.
          </li>
          <li>
            State contract rulesets published for{" "}
            {STATE_IDS.map((s) => STATE_RULES[s].stateName).join(", ")} —{" "}
            {STATE_IDS.map((s) => (
              <span key={s} className="num">
                {STATE_RULES[s].ruleSetVersion}{" "}
              </span>
            ))}
            . Clause language is unverified template text pending construction attorney
            review.
          </li>
        </ul>
      </section>
    </article>
  );
}
