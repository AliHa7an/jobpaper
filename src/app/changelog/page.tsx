import type { Metadata } from "next";
import Link from "next/link";

import {
  STATE_IDS,
  STATE_RULES,
  TRADE_IDS,
  TRADE_RULES,
  untranscribedClauses,
} from "@engine";

import { formatDate } from "@/lib/format";

/* Historical entries name the versions they shipped, literally. Reading the
   CURRENT ruleSetVersion into a dated entry would silently rewrite history the
   first time a ruleset was corrected — which is the opposite of a changelog. */
const V1_STATE_VERSIONS = "states-ca-2026-08, states-tx-2026-08, states-fl-2026-08, states-ny-2026-08, states-pa-2026-08";

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
          <time className="num" dateTime="2026-08-15">
            {formatDate("2026-08-15")}
          </time>
        </p>
        <h2>State rulesets corrected against primary sources</h2>
        <ul className="mt-2 ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
          <li>
            State contract rulesets bumped to{" "}
            {STATE_IDS.map((s) => (
              <span key={s} className="num">
                {STATE_RULES[s].ruleSetVersion}{" "}
              </span>
            ))}
            .
          </li>
          <li>
            <strong>
              JobPaper no longer generates contracts for{" "}
              {STATE_IDS.filter((s) => untranscribedClauses(STATE_RULES[s]).length > 0)
                .map((s) => STATE_RULES[s].stateName)
                .join(", ")}
              .
            </strong>{" "}
            Those states prescribe notice wording word-for-word — with type-size,
            placement and signature rules attached — and JobPaper had been shipping
            paraphrases of it, or omitting the notice entirely. A paraphrase of prescribed
            text is not a weaker clause; it is a non-compliant contract. The generator
            fails closed until each notice is transcribed from the statute. Every affected
            clause is listed with its statute and source on its{" "}
            <Link href="/contracts/CA" className="underline underline-offset-4">
              state requirements page
            </Link>
            .
          </li>
          <li>
            New York: the statewide licence-display flag was wrong. Gen. Bus. Law
            §771(1)(a) requires the licence number &ldquo;if applicable&rdquo;, and New
            York has no universal state contractor licence — licensing is county and
            municipal. The flag is now jurisdiction-scoped and off at state level.
          </li>
          <li>
            Pennsylvania: the down-payment cap cited 73 P.S. §517.7(e), which contains no
            down-payment limit. Corrected to §517.9, and the trigger now matches the rule
            it describes — one-third of the price (plus special-order materials) on
            contracts over $5,000, using exact thirds rather than 33%. It no longer fires
            on contracts of $5,000 or less, where no cap applies.
          </li>
          <li>
            Texas: the bills-paid affidavit clause carried a $5,000 threshold that Tex.
            Prop. Code §53.259 does not impose, suppressing a required clause on every
            smaller contract. The threshold is removed.
          </li>
        </ul>
      </section>

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
            <span className="num">{V1_STATE_VERSIONS}</span>. Clause language is unverified
            template text pending construction attorney review.
          </li>
        </ul>
      </section>
    </article>
  );
}
