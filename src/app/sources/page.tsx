import type { Metadata } from "next";
import Link from "next/link";

import { STATE_IDS, STATE_RULES, TRADE_IDS, TRADE_RULES } from "@engine";

export const metadata: Metadata = {
  title: "Sources — Every Ruleset, Cited and Dated",
  description:
    "Every pricing ruleset and state contract ruleset behind JobPaper, with its citations and last-verified dates.",
};

export default function SourcesPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Sources</h1>
      <p className="max-w-2xl">
        Everything JobPaper computes traces to a versioned rules file with citations and a
        last-verified date. When a source changes, one file changes, and every affected
        page updates. See the{" "}
        <Link href="/pricing-methodology" className="text-signal underline">
          pricing methodology
        </Link>{" "}
        for how the numbers are used.
      </p>

      <section>
        <h2 className="mb-3 text-xl font-bold">Pricing rulesets</h2>
        <ul className="space-y-3">
          {TRADE_IDS.map((t) => {
            const r = TRADE_RULES[t];
            return (
              <li key={t} className="rounded border border-rule bg-sheet p-4 text-sm">
                <p className="font-semibold">
                  {r.label} — <span className="num">{r.ruleSetVersion}</span> (effective{" "}
                  <span className="num">{r.effectiveFrom}</span>)
                </p>
                <p className="mt-1 text-flag">{r.dataBasis}</p>
                <ul className="mt-1 list-disc ps-5 text-dim">
                  {r.citations.map((c) => (
                    <li key={c.label}>
                      {c.label} — last verified <span className="num">{c.lastVerified}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">State contract rulesets</h2>
        <ul className="space-y-3">
          {STATE_IDS.map((s) => {
            const r = STATE_RULES[s];
            return (
              <li key={s} className="rounded border border-rule bg-sheet p-4 text-sm">
                <p className="font-semibold">
                  <Link href={`/contracts/${s}`} className="text-signal underline">
                    {r.stateName}
                  </Link>{" "}
                  — <span className="num">{r.ruleSetVersion}</span> (effective{" "}
                  <span className="num">{r.effectiveFrom}</span>)
                </p>
                <p className="mt-1 text-flag">
                  Clause text is UNVERIFIED template language pending construction attorney
                  review.
                </p>
                <ul className="mt-1 list-disc ps-5 text-dim">
                  {r.citations.map((c) => (
                    <li key={c.label}>
                      <a href={c.url} className="underline" rel="noopener">
                        {c.label}
                      </a>{" "}
                      — last verified <span className="num">{c.lastVerified}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
