import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCentsWholeDollars,
  getStateRules,
  STATE_IDS,
  type StateId,
} from "@engine";

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
  const lastVerified = rules.citations[0]?.lastVerified ?? rules.effectiveFrom;
  const otherStates = STATE_IDS.filter((s) => s !== rules.stateId);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">
        What does a {rules.stateName} home improvement contract have to include?
      </h1>

      {/* AnswerBox */}
      <p className="rounded border-l-4 border-signal bg-sheet p-4 text-lg">
        {rules.stateName} requires {rules.requiredClauses.length} categories of contract
        language for home improvement work
        {rules.homeImprovementThresholdCents > 0 ? (
          <>
            {" "}
            over{" "}
            <span className="num">
              {formatCentsWholeDollars(rules.homeImprovementThresholdCents)}
            </span>
          </>
        ) : null}
        : {alwaysCount} apply to every contract and {conditionalCount} trigger on job facts
        like the down payment or total price. Each clause below cites its statute.
      </p>

      <p className="border-l-4 border-flag pl-3 text-sm font-semibold text-flag">
        Clause language on this page is UNVERIFIED template text awaiting construction
        attorney review. It is a starting point, not legal advice.
      </p>

      {/* LastVerified */}
      <p className="text-sm text-dim">
        Rules verified <span className="num">{lastVerified}</span> · ruleset{" "}
        {rules.ruleSetVersion} · {rules.citations[0]?.label}
      </p>

      {/* FactTable */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded border border-rule bg-sheet text-sm">
          <caption className="sr-only">
            Key {rules.stateName} home improvement contract facts
          </caption>
          <tbody>
            <tr className="takeoff-row">
              <th scope="row" className="p-3 text-left font-semibold">
                Written-contract threshold
              </th>
              <td className="num p-3">
                {rules.homeImprovementThresholdCents > 0
                  ? formatCentsWholeDollars(rules.homeImprovementThresholdCents)
                  : "No general threshold"}
              </td>
            </tr>
            <tr className="takeoff-row">
              <th scope="row" className="p-3 text-left font-semibold">
                Required clause categories
              </th>
              <td className="num p-3">{rules.requiredClauses.length}</td>
            </tr>
            <tr className="takeoff-row">
              <th scope="row" className="p-3 text-left font-semibold">
                License / registration number on contract
              </th>
              <td className="p-3">{rules.licenseDisplayRequired ? "Yes" : "No statewide rule"}</td>
            </tr>
            <tr>
              <th scope="row" className="p-3 text-left font-semibold">
                Prohibited terms listed
              </th>
              <td className="num p-3">{rules.prohibitedTerms.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">
          Which clauses does {rules.stateName} require, and when?
        </h2>
        <ol className="space-y-3">
          {rules.requiredClauses.map((clause) => (
            <li key={clause.id} className="rounded border border-rule bg-sheet p-4">
              <p className="mb-1 flex flex-wrap items-baseline justify-between gap-2 font-semibold">
                <span>{clause.title}</span>
                <span className="num text-xs font-normal text-dim">{clause.statute}</span>
              </p>
              <p className="mb-1 text-sm text-dim">
                When it applies:{" "}
                {clause.trigger === "always" ? "every contract" : `when ${clause.trigger}`}
              </p>
              <p className="text-sm">{clause.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">
          What can&apos;t go in a {rules.stateName} home improvement contract?
        </h2>
        <ul className="list-disc space-y-1 ps-5 text-sm">
          {rules.prohibitedTerms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="rounded border border-rule bg-sheet p-4">
        <h2 className="mb-2 text-xl font-bold">Build this contract for your job</h2>
        <p className="mb-3 text-sm">
          The free generator prices your job on a takeoff sheet, then assembles the{" "}
          {rules.stateName} clauses your job facts trigger — with the statute cite on each
          one.
        </p>
        <Link
          href="/"
          className="btn inline-flex items-center rounded bg-signal px-4 py-2.5 font-semibold text-white"
        >
          Start your estimate
        </Link>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Sources</h2>
        <ul className="list-disc space-y-1 ps-5 text-sm">
          {rules.citations.map((c) => (
            <li key={c.label}>
              <a href={c.url} className="text-signal underline" rel="noopener">
                {c.label}
              </a>{" "}
              — last verified <span className="num">{c.lastVerified}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Related pages" className="border-t border-rule pt-4 text-sm">
        <p className="mb-2 font-semibold">Other states &amp; related pages</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {otherStates.map((s) => (
            <li key={s}>
              <Link href={`/contracts/${s}`} className="text-signal underline">
                {getStateRules(s).stateName} contract requirements
              </Link>
            </li>
          ))}
          <li>
            <Link href="/contract" className="text-signal underline">
              Contract generator
            </Link>
          </li>
          <li>
            <Link href="/pricing-methodology" className="text-signal underline">
              Pricing methodology
            </Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}
