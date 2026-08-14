import type { Metadata } from "next";
import Link from "next/link";

import { formatCents, REGION_LABELS, TRADE_IDS, TRADE_RULES, type RegionId } from "@engine";

export const metadata: Metadata = {
  title: "Pricing Methodology — Where Every Number Comes From",
  description:
    "How JobPaper estimates are computed: assemblies, waste factors, regional multipliers, overhead and profit — and the honest status of the v1 placeholder pricing data.",
};

const REGION_IDS = Object.keys(REGION_LABELS) as RegionId[];

export default function PricingMethodologyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">How JobPaper prices a job</h1>

      <p className="border-l-4 border-flag pl-3 font-semibold text-flag">
        Honest status: every unit cost and labor-hour figure in v1 is placeholder reference
        data — a modelled starting point, not market pricing. We ship real sourcing
        (licensed cost data, regional wage data, contractor sanity checks) before we call
        any number verified. Estimates carry this warning until then.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">The estimate formula</h2>
        <p>
          Every job decomposes into <strong>assemblies</strong> — a deck becomes footings,
          framing, decking, railing, and stairs; a bathroom becomes demo, rough-in, tile,
          fixtures. Each assembly has a deterministic quantity formula (per square foot,
          per linear foot, per unit), a waste factor, a material cost per grade tier, and a
          labor-hours-per-unit figure.
        </p>
        <pre className="num overflow-x-auto rounded border border-rule bg-sheet p-4 text-sm">
{`line total = qty x (1 + waste) x unit cost      (materials)
           + qty x hours/unit x access x rate   (labor)
subtotal   = sum of line totals
overhead   = subtotal x overhead%     (your number; taught default shown)
profit     = (subtotal + overhead) x profit%
total      = subtotal + overhead + profit
range      = total x [low%, high%]   -- estimates are ranges, not points`}
        </pre>
        <p>
          All money math is integer cents; rates are basis points. No AI touches any
          calculation — the engine is pure, dependency-free TypeScript with the rounding
          rules documented in one file and enforced by tests.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Regional multipliers</h2>
        <p>
          Material unit costs and labor rates are adjusted by region before any line is
          priced. Current placeholder multipliers (base = 100%):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded border border-rule bg-sheet text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-xs uppercase text-dim">
                <th scope="col" className="p-3">Trade</th>
                {REGION_IDS.map((r) => (
                  <th scope="col" key={r} className="p-3 text-right">
                    {REGION_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRADE_IDS.map((t) => (
                <tr key={t} className="takeoff-row">
                  <th scope="row" className="p-3 text-left font-semibold">
                    {TRADE_RULES[t].label}
                  </th>
                  {REGION_IDS.map((r) => (
                    <td key={r} className="num p-3 text-right">
                      {(TRADE_RULES[t].regionalMultipliersBps[r] / 100).toFixed(0)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Labor rates and versioning</h2>
        <ul className="list-disc space-y-1 ps-5">
          {TRADE_IDS.map((t) => (
            <li key={t}>
              <strong>{TRADE_RULES[t].label}:</strong>{" "}
              <span className="num">{formatCents(TRADE_RULES[t].laborRateCentsPerHour)}</span>
              /hr base — {TRADE_RULES[t].laborRateBasis}. Ruleset{" "}
              <span className="num">{TRADE_RULES[t].ruleSetVersion}</span>, stale after{" "}
              <span className="num">{TRADE_RULES[t].staleAfterDays}</span> days without
              re-verification; stale rules flag every estimate they produce.
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">The planned data ladder</h2>
        <p>
          In order of preference: licensed cost databases, public prevailing-wage and BLS
          regional wage data, retailer material pricing for commodity materials, and —
          clearly labelled — consented user-submitted actuals once volume exists. Every
          upgrade lands as a new versioned rules file with a changelog entry; see the{" "}
          <Link href="/changelog" className="text-signal underline">
            changelog
          </Link>{" "}
          and{" "}
          <Link href="/sources" className="text-signal underline">
            sources
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
