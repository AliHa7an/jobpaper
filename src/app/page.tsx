import type { Metadata } from "next";
import Link from "next/link";

import TakeoffBuilder from "@/components/TakeoffBuilder";

export const metadata: Metadata = {
  title: "Free Estimate Builder for Trades — Itemized, With Ranges",
  description:
    "Build an itemized job estimate on a live takeoff sheet: decks, interior paint, bathroom remodels. Edit any line, see the range instantly. Free, no signup.",
};

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="no-print">
        <h1 className="text-3xl font-bold">Build your estimate</h1>
        <p className="mt-1 max-w-2xl text-dim">
          Pick the trade, set the job, and watch the takeoff sheet price itself. Every line
          is editable; the sheet you build is the document your customer gets.
        </p>
      </div>

      <TakeoffBuilder />

      <section className="no-print max-w-3xl space-y-3 border-t border-rule pt-6 text-sm text-dim">
        <h2 className="text-base font-semibold text-ink">How this estimate is built</h2>
        <p>
          Each job decomposes into standard assemblies — a deck becomes footings, framing,
          decking, railing, and stairs — priced from versioned reference data with regional
          multipliers and waste factors. The math is deterministic: no AI touches a number.
          Read the full breakdown on the{" "}
          <Link href="/pricing-methodology" className="text-signal underline">
            pricing methodology
          </Link>{" "}
          page, check the{" "}
          <Link href="/sources" className="text-signal underline">
            sources
          </Link>
          , or see what your state requires in a contract on the{" "}
          <Link href="/contracts/CA" className="text-signal underline">
            state contract rules
          </Link>{" "}
          pages.
        </p>
        <p>
          v1 pricing is placeholder reference data pending licensed cost data and review by
          working contractors. Ranges and shown assumptions are how an estimate survives
          being occasionally wrong — always sanity-check unit costs against your suppliers.
        </p>
      </section>
    </div>
  );
}
