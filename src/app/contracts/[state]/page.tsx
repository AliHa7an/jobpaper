import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getStateRules, STATE_IDS, type StateId } from "@engine";

import {
  AnswerBox,
  Button,
  FactTable,
  LastVerified,
  LedgerTable,
  SourceCitation,
  WarningStack,
  type LedgerRow,
} from "@/components/ui";
import { usd } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams(): { state: string }[] {
  return STATE_IDS.map((state) => ({ state }));
}

function ruleForParam(param: string): ReturnType<typeof getStateRules> | null {
  const upper = param.toUpperCase();
  if (!STATE_IDS.includes(upper as StateId)) return null;
  return getStateRules(upper as StateId);
}

export async function generateMetadata({
  params,
}: PageProps<"/contracts/[state]">): Promise<Metadata> {
  const { state } = await params;
  const rules = ruleForParam(state);
  if (!rules) return {};
  return {
    title: `${rules.stateName} Home Improvement Contract Requirements (2026)`,
    description: `The clauses ${rules.stateName} law requires in a home improvement contract, each with its statute cite — plus a free generator that assembles them for your job. Not legal advice.`,
  };
}

export default async function StateContractPage({
  params,
}: PageProps<"/contracts/[state]">) {
  const { state } = await params;
  const rules = ruleForParam(state);
  if (!rules) notFound();

  const alwaysCount = rules.requiredClauses.filter((c) => c.trigger === "always").length;
  const conditionalCount = rules.requiredClauses.length - alwaysCount;
  const primary = rules.citations[0];
  const otherStates = STATE_IDS.filter((s) => s !== rules.stateId);

  const clauseRows: LedgerRow[] = rules.requiredClauses.map((clause) => ({
    id: clause.id,
    cells: {
      clause: (
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span className="text-ink" style={{ fontWeight: 600 }}>
            {clause.title}
          </span>
          <span className="text-dim" style={{ fontWeight: 400 }}>
            {clause.text}
          </span>
        </span>
      ),
      when: (
        <span className="text-dim">
          {clause.trigger === "always" ? (
            "Every contract"
          ) : (
            <>
              When <span className="num">{clause.trigger}</span>
            </>
          )}
        </span>
      ),
      statute: (
        <span className="num text-dim" style={{ fontSize: "var(--text-step--2)" }}>
          {clause.statute}
        </span>
      ),
    },
  }));

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1>
        What does a {rules.stateName} home improvement contract have to include?
      </h1>

      <AnswerBox>
        {rules.stateName} requires{" "}
        <span className="num">{rules.requiredClauses.length}</span> categories of contract
        language for home improvement work
        {rules.homeImprovementThresholdCents > 0 ? (
          <>
            {" "}
            over <span className="num">{usd(rules.homeImprovementThresholdCents)}</span>
          </>
        ) : null}
        : <span className="num">{alwaysCount}</span> apply to every contract and{" "}
        <span className="num">{conditionalCount}</span> trigger on job facts such as the
        down payment or the total price.
      </AnswerBox>

      {primary ? (
        <LastVerified
          date={primary.lastVerified}
          ruleSetVersion={rules.ruleSetVersion}
          citation={{ label: primary.label, url: primary.url }}
        />
      ) : null}

      <WarningStack
        warnings={[
          {
            id: "unverified-clauses",
            severity: "irreversible",
            label: "Unverified wording",
            title: (
              <>
                The clause language on this page is UNVERIFIED template text awaiting
                construction attorney review.
              </>
            ),
            body: (
              <>
                Which clauses {rules.stateName} triggers is encoded from the statutes cited
                below; the exact wording is not yet confirmed against primary sources. Use
                it as a starting point and have an attorney review the contract you sign.
              </>
            ),
          },
        ]}
      />

      <FactTable
        caption={`Key ${rules.stateName} home improvement contract facts`}
        rows={[
          {
            key: "Written-contract threshold",
            value:
              rules.homeImprovementThresholdCents > 0
                ? usd(rules.homeImprovementThresholdCents)
                : "No general threshold",
          },
          { key: "Required clause categories", value: rules.requiredClauses.length },
          { key: "Apply to every contract", value: alwaysCount },
          { key: "Trigger on job facts", value: conditionalCount },
          {
            key: "License number on the contract",
            value: rules.licenseDisplayRequired ? "Required" : "No statewide rule",
            mono: false,
          },
          { key: "Prohibited terms listed", value: rules.prohibitedTerms.length },
        ]}
      />

      <section className="space-y-3">
        <h2>Which clauses does {rules.stateName} require, and when?</h2>
        <LedgerTable
          caption={`${rules.requiredClauses.length} required clause categories in ${rules.stateName}, with their triggers and statutes`}
          columns={[
            { id: "clause", label: "Clause" },
            { id: "when", label: "When it applies" },
            { id: "statute", label: "Statute" },
          ]}
          rows={clauseRows}
        />
      </section>

      {rules.prohibitedTerms.length > 0 ? (
        <section className="space-y-2">
          <h2>What cannot go in a {rules.stateName} home improvement contract?</h2>
          <ul className="text-dim ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
            {rules.prohibitedTerms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        className="hairline-all rounded-atlas flex flex-col items-start gap-3 p-6"
        style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper-raised)" }}
      >
        <h2>Build this contract for your job</h2>
        <p className="text-dim" style={{ margin: 0, maxWidth: "var(--measure)" }}>
          Price the job on the takeoff sheet, and the generator assembles the{" "}
          {rules.stateName} clauses your job facts trigger — each one carrying its statute.
        </p>
        <Link href="/">
          <Button className="touch-lg">Price a job</Button>
        </Link>
      </section>

      <section className="space-y-2">
        <h2>Sources</h2>
        <ul className="ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
          {rules.citations.map((c, i) => (
            <li key={c.label}>
              <a href={c.url} className="underline underline-offset-4" rel="noopener">
                {c.label}
              </a>
              <SourceCitation
                index={i + 1}
                label={c.label}
                url={c.url}
                lastVerified={c.lastVerified}
              />
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Related pages" className="hairline-t pt-4">
        <p className="micro-label mb-2">Other states and related pages</p>
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          {otherStates.map((s) => (
            <li key={s}>
              <Link href={`/contracts/${s}`} className="underline underline-offset-4">
                {getStateRules(s).stateName} requirements
              </Link>
            </li>
          ))}
          <li>
            <Link href="/contract" className="underline underline-offset-4">
              Contract generator
            </Link>
          </li>
          <li>
            <Link href="/pricing-methodology" className="underline underline-offset-4">
              Pricing methodology
            </Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}
