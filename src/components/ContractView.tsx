"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import {
  formatCents,
  getStateRules,
  getTradeRules,
  selectClauses,
  STATE_IDS,
  type Estimate,
  type StateId,
} from "@engine";

import { loadContractFacts, loadEstimate, saveContractFacts } from "@/lib/store";

interface ContractFormValues {
  stateId: StateId;
  downPaymentDollars: number;
  contractorName: string;
  ownerName: string;
}

export default function ContractView() {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loaded, setLoaded] = useState(false);

  const { register, watch, setValue } = useForm<ContractFormValues>({
    mode: "onChange",
    defaultValues: {
      stateId: "CA",
      downPaymentDollars: 0,
      contractorName: "",
      ownerName: "",
    },
  });
  const values = watch();

  useEffect(() => {
    setEstimate(loadEstimate());
    const facts = loadContractFacts();
    if (facts) {
      setValue("stateId", facts.stateId);
      setValue("downPaymentDollars", facts.downPaymentCents / 100);
    }
    setLoaded(true);
  }, [setValue]);

  const selection = useMemo(() => {
    if (!estimate) return null;
    const stateRules = getStateRules(values.stateId ?? "CA");
    const downPaymentCents = Number.isFinite(values.downPaymentDollars)
      ? Math.max(0, Math.round(values.downPaymentDollars * 100))
      : 0;
    return {
      result: selectClauses(stateRules, {
        totalCents: estimate.totals.totalCents,
        downPaymentCents,
      }),
      stateRules,
      downPaymentCents,
    };
  }, [estimate, values.stateId, values.downPaymentDollars]);

  useEffect(() => {
    if (loaded && selection) {
      saveContractFacts({
        stateId: selection.stateRules.stateId,
        downPaymentCents: selection.downPaymentCents,
      });
    }
  }, [loaded, selection]);

  if (!loaded) return null;

  if (!estimate || !selection) {
    return (
      <div className="rounded border border-rule bg-sheet p-8 text-center">
        <p className="mb-4">
          No estimate yet — the contract pulls its price and scope from your takeoff sheet.
        </p>
        <Link
          href="/"
          className="btn inline-flex items-center rounded bg-signal px-4 py-2.5 font-semibold text-white"
        >
          Build your estimate
        </Link>
      </div>
    );
  }

  const { result, stateRules } = selection;
  const tradeRules = getTradeRules(estimate.job.trade);
  const inputClass = "w-full rounded border border-rule bg-sheet px-3 py-2";

  return (
    <div className="space-y-6">
      <form
        className="no-print grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Contract details"
      >
        <div>
          <label htmlFor="stateId" className="mb-1 block text-sm font-semibold">
            State
          </label>
          <select id="stateId" className={inputClass} {...register("stateId")}>
            {STATE_IDS.map((s) => (
              <option key={s} value={s}>
                {getStateRules(s).stateName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="downPaymentDollars" className="mb-1 block text-sm font-semibold">
            Down payment ($)
          </label>
          <input
            id="downPaymentDollars"
            type="number"
            min={0}
            step={0.01}
            className={`${inputClass} num`}
            {...register("downPaymentDollars", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label htmlFor="contractorName" className="mb-1 block text-sm font-semibold">
            Contractor
          </label>
          <input
            id="contractorName"
            placeholder="Your business name"
            className={inputClass}
            {...register("contractorName")}
          />
        </div>
        <div>
          <label htmlFor="ownerName" className="mb-1 block text-sm font-semibold">
            Owner
          </label>
          <input
            id="ownerName"
            placeholder="Customer name"
            className={inputClass}
            {...register("ownerName")}
          />
        </div>
      </form>

      <div className="print-sheet max-w-3xl rounded border border-rule bg-sheet p-4 shadow-sm sm:p-6">
        <p className="mb-4 border-l-4 border-flag pl-3 text-sm font-semibold text-flag">
          Template, not legal advice. Clause language is UNVERIFIED and requires attorney
          review before use. JobPaper selects which clauses {stateRules.stateName} law
          appears to require — a construction attorney must confirm the wording and the
          list.
        </p>

        <header className="mb-4 border-b-2 border-ink pb-3">
          <p className="text-xs font-semibold tracking-widest text-dim">
            HOME IMPROVEMENT CONTRACT — {stateRules.stateName.toUpperCase()} TEMPLATE
          </p>
          <h1 className="text-xl font-bold">
            {tradeRules.label} — {formatCents(estimate.totals.totalCents)}
          </h1>
          <p className="text-sm text-dim">
            Contractor: {values.contractorName || "____________________"} · Owner:{" "}
            {values.ownerName || "____________________"}
            {result.licenseDisplayRequired ? (
              <>
                {" "}
                · License/registration #: ____________ (display required in{" "}
                {stateRules.stateName})
              </>
            ) : null}
          </p>
        </header>

        <section className="mb-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">1. Scope of work</h2>
          <ul className="list-disc space-y-0.5 ps-5 text-sm">
            {estimate.lineItems.map((li) => (
              <li key={li.id}>
                {li.description} — <span className="num">{li.qty}</span> {li.unit}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">2. Price & payment</h2>
          <p className="text-sm">
            Contract price: <span className="num font-semibold">{formatCents(estimate.totals.totalCents)}</span>.
            Down payment: <span className="num">{formatCents(selection.downPaymentCents)}</span>.
            Remaining payments to be scheduled against work performed and materials
            delivered.
          </p>
        </section>

        <section className="mb-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">
            3. Clauses {stateRules.stateName} law requires for this job
          </h2>
          <ol className="space-y-3 ps-0">
            {result.clauses.map((clause, i) => (
              <li key={clause.id} className="rounded border border-rule p-3">
                <p className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold">
                  <span>
                    3.{i + 1} {clause.title}
                  </span>
                  <span className="num text-xs font-normal text-dim">{clause.statute}</span>
                </p>
                <p className="text-sm">{clause.text}</p>
                <p className="mt-1 text-xs text-dim">Included because: {clause.reason}</p>
              </li>
            ))}
          </ol>
        </section>

        {result.prohibitedTerms.length > 0 ? (
          <section className="mb-4">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">
              Do not add these terms
            </h2>
            <p className="mb-1 text-xs text-dim">
              {stateRules.stateName} restricts or prohibits the following in home
              improvement contracts:
            </p>
            <ul className="list-disc space-y-0.5 ps-5 text-sm">
              {result.prohibitedTerms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mb-2 grid grid-cols-2 gap-8 pt-6 text-sm">
          <div>
            <div className="border-b border-ink pb-8" aria-hidden="true" />
            <p className="mt-1">Contractor signature · date</p>
          </div>
          <div>
            <div className="border-b border-ink pb-8" aria-hidden="true" />
            <p className="mt-1">Owner signature · date</p>
          </div>
        </section>

        <footer className="mt-4 border-t border-rule pt-3 text-xs text-dim">
          <p>
            Ruleset {result.ruleSetVersion} · sources:{" "}
            {result.citations.map((c) => c.label).join(" · ")} · clause selection is
            deterministic from the job facts (total{" "}
            <span className="num">{formatCents(estimate.totals.totalCents)}</span>, down
            payment <span className="num">{formatCents(selection.downPaymentCents)}</span>).
            This is a template, not legal advice.
          </p>
        </footer>
      </div>

      <div className="no-print flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-signal px-4 py-2.5 font-semibold text-white"
        >
          Print contract
        </button>
        <Link
          href={`/contracts/${stateRules.stateId}`}
          className="btn inline-flex items-center rounded border border-rule px-4 py-2.5 font-semibold"
        >
          What {stateRules.stateName} requires
        </Link>
        <Link
          href="/"
          className="btn inline-flex items-center rounded border border-rule px-4 py-2.5 font-semibold"
        >
          Back to estimate
        </Link>
      </div>
    </div>
  );
}
