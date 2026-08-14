import type { Metadata } from "next";
import Link from "next/link";

import { STATE_IDS, STATE_RULES, TRADE_IDS, TRADE_RULES } from "@engine";

export const metadata: Metadata = {
  title: "Changelog — Dated, Cited Rule Changes",
  description:
    "Every change to JobPaper's pricing and state contract rulesets, dated and cited.",
};

export default function ChangelogPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Changelog</h1>
      <p className="max-w-2xl text-dim">
        Rule changes land here within 48 hours, with the ruleset version and citation. See{" "}
        <Link href="/sources" className="text-signal underline">
          sources
        </Link>{" "}
        for the full citation list.
      </p>

      <section className="rounded border border-rule bg-sheet p-4">
        <h2 className="text-lg font-bold">
          <span className="num">2026-08-08</span> — v1 launch rulesets
        </h2>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
          <li>
            Pricing rulesets published for{" "}
            {TRADE_IDS.map((t) => TRADE_RULES[t].label.toLowerCase()).join(", ")} (
            {TRADE_IDS.map((t) => TRADE_RULES[t].ruleSetVersion).join(", ")}). All pricing
            is placeholder reference data pending licensed cost data and contractor review
            — estimates carry the warning until re-verified.
          </li>
          <li>
            State contract rulesets published for{" "}
            {STATE_IDS.map((s) => STATE_RULES[s].stateName).join(", ")} (
            {STATE_IDS.map((s) => STATE_RULES[s].ruleSetVersion).join(", ")}). Clause
            language is UNVERIFIED template text pending construction attorney review.
          </li>
        </ul>
      </section>
    </article>
  );
}
