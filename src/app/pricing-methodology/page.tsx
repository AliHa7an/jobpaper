import type { Metadata } from "next";
import Link from "next/link";

import { REGION_LABELS, TRADE_IDS, TRADE_RULES, type RegionId } from "@engine";

import {
  AnswerBox,
  LastVerified,
  LedgerTable,
  WarningStack,
  type LedgerRow,
} from "@/components/ui";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pricing Methodology — Where Every Number Comes From",
  description:
    "How JobPaper estimates are computed: assemblies, waste factors, regional multipliers, overhead and profit — and the honest status of the v1 placeholder pricing data.",
};

const REGION_IDS = Object.keys(REGION_LABELS) as RegionId[];

export default function PricingMethodologyPage() {
  const primary = TRADE_RULES.decks.citations[0];

  /* Regions down the side, trades across: a contractor looks up their own
     region, not a trade. Three data columns fit the measure; seven did not. */
  const regionRows: LedgerRow[] = REGION_IDS.map((r) => ({
    id: r,
    cells: {
      region: REGION_LABELS[r],
      ...Object.fromEntries(
        TRADE_IDS.map((t) => [t, `${TRADE_RULES[t].regionalMultipliersBps[r] / 100}%`]),
      ),
    },
  }));

  const rateRows: LedgerRow[] = TRADE_IDS.map((t) => ({
    id: t,
    cells: {
      trade: TRADE_RULES[t].label,
      rate: `${formatCents(TRADE_RULES[t].laborRateCentsPerHour)}/hr`,
      ruleset: TRADE_RULES[t].ruleSetVersion,
      stale: `${TRADE_RULES[t].staleAfterDays} days`,
    },
  }));

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1>How JobPaper prices a job</h1>

      <AnswerBox>
        Every job decomposes into assemblies with a quantity formula, a waste factor, a
        material cost per grade tier and a labor-hours-per-unit figure. Materials plus
        labor make the subtotal; overhead and profit are yours to set. The result is a
        band, not a point: a deck quotes from{" "}
        <span className="num">{100 - TRADE_RULES.decks.rangeBps.low / 100}%</span> below the
        computed total to{" "}
        <span className="num">{TRADE_RULES.decks.rangeBps.high / 100 - 100}%</span> above it.
      </AnswerBox>

      {primary ? (
        <LastVerified
          date={primary.lastVerified}
          ruleSetVersion={TRADE_RULES.decks.ruleSetVersion}
          citation={{ label: primary.label, url: primary.url }}
        />
      ) : null}

      <WarningStack
        warnings={[
          {
            id: "placeholder-data",
            severity: "irreversible",
            label: "Unverified pricing",
            title: (
              <>
                Every unit cost, labor rate and multiplier in v1 is placeholder reference
                data.
              </>
            ),
            body: (
              <>
                It is a modelled starting point, not market pricing. Real sourcing —
                licensed cost data, regional wage data, and a sanity check by two working
                contractors — is a launch gate, and every estimate carries this warning
                until that gate is passed.
              </>
            ),
          },
        ]}
      />

      <section className="space-y-3">
        <h2>The estimate formula</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          A deck becomes footings, framing, decking, railing and stairs; a bathroom becomes
          demo, rough-in, tile and fixtures. Each assembly is priced the same way, and the
          order of operations is fixed:
        </p>
        <pre
          className="num hairline-all rounded-atlas overflow-x-auto p-4"
          style={{
            borderRadius: "var(--radius-atlas)",
            background: "var(--paper-sunken)",
            fontSize: "var(--text-step--1)",
          }}
        >
          {`line total = qty x (1 + waste) x unit cost      (materials)
           + qty x hours/unit x access x rate   (labor)
subtotal   = sum of line totals
overhead   = subtotal x overhead%     (your number; taught default shown)
profit     = (subtotal + overhead) x profit%
total      = subtotal + overhead + profit
range      = total x [low%, high%]   -- estimates are ranges, not points`}
        </pre>
        <p style={{ maxWidth: "var(--measure)" }}>
          All money math is integer cents and all rates are basis points. No AI touches a
          calculation: the engine is dependency-free TypeScript with its rounding rules
          documented in one file and pinned by tests.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Regional multipliers</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          Material unit costs and labor rates are adjusted by region before any line is
          priced, so every unit cost on your sheet is already local. Base is{" "}
          <span className="num">100%</span>.
        </p>
        <LedgerTable
          caption="Placeholder regional cost multipliers by region and trade"
          columns={[
            { id: "region", label: "Region" },
            ...TRADE_IDS.map((t) => ({
              id: t,
              label: TRADE_RULES[t].label,
              numeric: true,
            })),
          ]}
          rows={regionRows}
        />
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
          The three launch trades currently share one multiplier per region. They are
          separate values in separate rules files, so they can diverge the moment real
          wage data says they should.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Labor rates and versioning</h2>
        <LedgerTable
          caption="Base labor rate, ruleset version and stale window per trade"
          columns={[
            { id: "trade", label: "Trade" },
            { id: "rate", label: "Base rate", numeric: true },
            { id: "ruleset", label: "Ruleset", numeric: true },
            { id: "stale", label: "Stale after", numeric: true },
          ]}
          rows={rateRows}
        />
        <p className="text-dim" style={{ fontSize: "var(--text-step--1)", maxWidth: "var(--measure)" }}>
          Past its stale window, a ruleset flags every estimate it produces. Basis:{" "}
          {TRADE_RULES.decks.laborRateBasis}
        </p>
      </section>

      <section className="space-y-3">
        <h2>The planned data ladder</h2>
        <p style={{ maxWidth: "var(--measure)" }}>
          In order of preference: licensed cost databases, public prevailing-wage and BLS
          regional wage data, retailer material pricing for commodity materials, and —
          clearly labeled — consented user-submitted actuals once volume exists. Every
          upgrade lands as a new versioned rules file with a{" "}
          <Link href="/changelog" className="underline underline-offset-4">
            changelog
          </Link>{" "}
          entry, and every ruleset is listed on{" "}
          <Link href="/sources" className="underline underline-offset-4">
            sources
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
