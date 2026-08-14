import type { Metadata } from "next";
import Link from "next/link";

import { STATE_IDS, STATE_RULES, TRADE_IDS, TRADE_RULES } from "@engine";

import { SourceCitation, WarningStack } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sources — Every Ruleset, Cited and Dated",
  description:
    "Every pricing ruleset and state contract ruleset behind JobPaper, with its citations and last-verified dates.",
};

export default function SourcesPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1>Sources</h1>
      <p style={{ maxWidth: "var(--measure)" }}>
        Everything JobPaper computes traces to a versioned rules file carrying citations
        and a last-verified date. When a source changes, one file changes and every
        affected page updates. How the numbers are used is on the{" "}
        <Link href="/pricing-methodology" className="underline underline-offset-4">
          pricing methodology
        </Link>{" "}
        page.
      </p>

      <WarningStack
        warnings={[
          {
            id: "unverified-everything",
            severity: "irreversible",
            label: "Unverified data",
            title: (
              <>
                Both rule families below are unverified: pricing is placeholder reference
                data, and clause wording awaits construction attorney review.
              </>
            ),
            body: (
              <>
                The citation URLs on the pricing rulesets are placeholders until a licensed
                cost source lands. Nothing here is a market quote and nothing here is legal
                advice.
              </>
            ),
          },
        ]}
      />

      <section className="space-y-3">
        <h2>Pricing rulesets</h2>
        <ul className="flex list-none flex-col gap-3 p-0">
          {TRADE_IDS.map((t) => {
            const r = TRADE_RULES[t];
            return (
              <li
                key={t}
                className="hairline-all rounded-atlas p-4"
                style={{
                  borderRadius: "var(--radius-atlas)",
                  background: "var(--paper-raised)",
                }}
              >
                <p style={{ fontWeight: 600 }}>
                  {r.label} — <span className="num">{r.ruleSetVersion}</span>
                </p>
                <p
                  className="text-dim"
                  style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}
                >
                  Effective <span className="num">{formatDate(r.effectiveFrom)}</span> ·{" "}
                  {r.dataBasis}
                </p>
                <ul
                  className="text-dim mt-2 ml-5 list-disc"
                  style={{ fontSize: "var(--text-step--1)" }}
                >
                  {r.citations.map((c, i) => (
                    <li key={c.label}>
                      {c.label} — verified{" "}
                      <span className="num">{formatDate(c.lastVerified)}</span>
                      <SourceCitation
                        index={i + 1}
                        label={c.label}
                        url={c.url}
                        lastVerified={c.lastVerified}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2>State contract rulesets</h2>
        <ul className="flex list-none flex-col gap-3 p-0">
          {STATE_IDS.map((s) => {
            const r = STATE_RULES[s];
            return (
              <li
                key={s}
                className="hairline-all rounded-atlas p-4"
                style={{
                  borderRadius: "var(--radius-atlas)",
                  background: "var(--paper-raised)",
                }}
              >
                <p style={{ fontWeight: 600 }}>
                  <Link href={`/contracts/${s}`} className="underline underline-offset-4">
                    {r.stateName}
                  </Link>{" "}
                  — <span className="num">{r.ruleSetVersion}</span>
                </p>
                <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                  Effective <span className="num">{formatDate(r.effectiveFrom)}</span> ·{" "}
                  <span className="num">{r.requiredClauses.length}</span> required clause
                  categories · clause text unverified
                </p>
                <ul
                  className="text-dim mt-2 ml-5 list-disc"
                  style={{ fontSize: "var(--text-step--1)" }}
                >
                  {r.citations.map((c, i) => (
                    <li key={c.label}>
                      <a
                        href={c.url}
                        className="underline underline-offset-4"
                        rel="noopener"
                      >
                        {c.label}
                      </a>{" "}
                      — verified{" "}
                      <span className="num">{formatDate(c.lastVerified)}</span>
                      <SourceCitation
                        index={i + 1}
                        label={c.label}
                        url={c.url}
                        lastVerified={c.lastVerified}
                      />
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
