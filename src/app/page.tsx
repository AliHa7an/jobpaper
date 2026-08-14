import type { Metadata } from "next";
import Link from "next/link";

import { STATE_IDS, STATE_RULES, TRADE_IDS, TRADE_RULES } from "@engine";

import TakeoffBuilder from "@/components/TakeoffBuilder";
import { LastVerified } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Free Estimate Builder for Trades — Itemised, With Ranges",
  description:
    "Price a deck, an interior paint job or a bathroom remodel on a live takeoff sheet. Edit any line, watch the total move, print the sheet your customer gets. Free, no signup.",
};

export default function HomePage() {
  const citation = TRADE_RULES.decks.citations[0];

  return (
    <div className="space-y-8">
      {/* The hero is the tool. One line of orientation, then the sheet. */}
      <div className="no-print">
        <h1>Price the job on a takeoff sheet</h1>
        <p className="text-dim mt-1" style={{ maxWidth: "var(--measure)" }}>
          Set the trade and the measurements; every line prices itself. Edit any figure and
          the total moves with it — and the sheet you build is the document your customer
          receives.
        </p>
      </div>

      <TakeoffBuilder />

      {/* Everything below the fold is prose, at reading density. */}
      <div className="no-print density-reading hairline-t pt-8">
        {citation ? (
          <LastVerified
            date={citation.lastVerified}
            ruleSetVersion={TRADE_RULES.decks.ruleSetVersion}
            citation={{ label: citation.label, url: citation.url }}
          />
        ) : null}

        <h2>How this estimate is built</h2>
        <p>
          Each job decomposes into standard assemblies — a deck becomes footings, framing,
          decking, railing and stairs — and each assembly carries a quantity formula, a
          waste factor, a material cost per grade tier and a labor-hours-per-unit figure.
          Quantities are region-adjusted before anything is priced. Materials plus labor
          make the subtotal; overhead and profit are your numbers, shown with the taught
          defaults contractors most often use. All money math is integer cents and no AI
          touches a figure. The full formula is on the{" "}
          <Link href="/pricing-methodology" className="underline underline-offset-4">
            pricing methodology
          </Link>{" "}
          page, and every ruleset is listed with its citations on{" "}
          <Link href="/sources" className="underline underline-offset-4">
            sources
          </Link>
          .
        </p>

        <h2>Why the estimate is a range</h2>
        <p>
          A point estimate on a job you have not walked is a guess wearing a suit. JobPaper
          quotes a low–high band around the computed total and shows the assumption behind
          every line, so when a footing hits rock or a wall needs a second coat, the
          conversation starts from something you wrote down rather than something you
          promised. v1 prices are placeholder reference data pending a licensed cost source
          and review by two working contractors — every sheet says so, and it will keep
          saying so until that review lands. Check the numbers against your own suppliers.
        </p>

        <h2>Then paper it</h2>
        <p>
          The invoice mirrors the sheet line for line and matches the total to the cent. The
          contract pulls the same price and scope, then adds the clauses your state requires
          for a job that size — each one carrying its statute. Start with{" "}
          {STATE_IDS.map((s, i) => (
            <span key={s}>
              {i > 0 ? (i === STATE_IDS.length - 1 ? " or " : ", ") : ""}
              <Link href={`/contracts/${s}`} className="underline underline-offset-4">
                {STATE_RULES[s].stateName}
              </Link>
            </span>
          ))}
          . It is a template, not legal advice — have an attorney review it before you sign.
        </p>

        <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          Trades priced today:{" "}
          {TRADE_IDS.map((t) => TRADE_RULES[t].label.toLowerCase()).join(", ")}. Rules
          verified{" "}
          <span className="num">{formatDate(citation?.lastVerified ?? "")}</span>. Nothing
          you enter leaves your browser.
        </p>
      </div>
    </div>
  );
}
