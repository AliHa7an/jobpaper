"use client";

/**
 * The contract: the same job, papered.
 *
 * Clause selection is deterministic — the state's trigger expressions are
 * evaluated against this job's facts (total price, down payment), and each
 * selected clause keeps its statute cite on the face of the document, because
 * a clause a contractor cannot trace is a clause they cannot defend.
 *
 * "Template, not legal advice" is on every contract surface, in flag orange,
 * with an icon and the words. It is the highest-stakes claim in the product:
 * clause language here is UNVERIFIED and awaits construction attorney review.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  getStateRules,
  getTradeRules,
  selectClauses,
  STATE_IDS,
  type StateId,
} from "@engine";

import {
  Button,
  EmptyState,
  FactTable,
  Field,
  Input,
  LedgerTable,
  NumberInput,
  Select,
  SourceCitation,
  WarningStack,
  type LedgerRow,
  type Warning,
} from "@/components/ui";
import { formatCents, usd } from "@/lib/format";
import { saveContractFacts, useStoredContractFacts, useStoredEstimate } from "@/lib/store";

export default function ContractView() {
  /* `undefined` = still hydrating; `null` = nothing saved. Both come straight
     out of localStorage through useSyncExternalStore, so nothing here has to
     copy storage into state inside an effect. */
  const estimate = useStoredEstimate();
  const stored = useStoredContractFacts();

  /* An edit wins over what was stored; until the user edits, the stored value
     IS the value. No effect seeds the form, so there is no frame where the
     contract shows California to someone who saved Texas. */
  const [stateEdit, setStateEdit] = useState<StateId | null>(null);
  const [downPaymentEdit, setDownPaymentEdit] = useState<number | null>(null);
  const [contractorName, setContractorName] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const stateId = stateEdit ?? stored?.stateId ?? "CA";
  const downPaymentCents = downPaymentEdit ?? stored?.downPaymentCents ?? 0;

  const stateRules = getStateRules(stateId);

  const selection = useMemo(() => {
    if (!estimate) return null;
    return selectClauses(stateRules, {
      totalCents: estimate.totals.totalCents,
      downPaymentCents,
    });
  }, [estimate, stateRules, downPaymentCents]);

  /* Writing OUT to an external store is exactly what an effect is for. */
  useEffect(() => {
    if (estimate) saveContractFacts({ stateId, downPaymentCents });
  }, [estimate, stateId, downPaymentCents]);

  if (estimate === undefined) return null;

  if (!estimate || !selection) {
    return (
      <EmptyState
        heading="No job on the sheet yet"
        message="The contract pulls its price and its scope straight from your takeoff sheet, so it needs an estimate first."
        action={
          <Link href="/">
            <Button className="touch-lg">Price a job</Button>
          </Link>
        }
      />
    );
  }

  const tradeRules = getTradeRules(estimate.job.trade);

  const warnings: Warning[] = [
    {
      id: "not-legal-advice",
      severity: "irreversible",
      label: "Template only",
      title: (
        <>
          This is a contract template, not legal advice — and the clause wording is
          UNVERIFIED.
        </>
      ),
      body: (
        <>
          JobPaper selects which clauses {stateRules.stateName} law appears to require for a
          job of this size. A construction attorney must confirm both the list and the exact
          statutory wording before you put this in front of a customer. A signed contract
          missing a required clause can be voidable — that is the risk this notice exists
          for.
        </>
      ),
    },
  ];

  const scopeRows: LedgerRow[] = estimate.lineItems.map((li) => ({
    id: li.id,
    cells: {
      item: li.description,
      qty: li.qty,
      unit: <span className="text-dim">{li.unit}</span>,
    },
  }));

  const clauseRows: LedgerRow[] = selection.clauses.map((clause, i) => ({
    id: clause.id,
    cells: {
      clause: (
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span className="text-ink" style={{ fontWeight: 600 }}>
            3.{i + 1} {clause.title}
          </span>
          <span className="text-dim" style={{ fontWeight: 400 }}>
            {clause.text}
          </span>
          <span className="pinned-note">Included because: {clause.reason}</span>
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
    <div className="space-y-6">
      <form
        className="no-print grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Contract details"
        onSubmit={(e) => e.preventDefault()}
      >
        <Field label="State" htmlFor="stateId" className="min-w-0">
          <Select
            id="stateId"
            value={stateId}
            onChange={(v) => setStateEdit(v as StateId)}
            options={STATE_IDS.map((s) => ({
              value: s,
              label: getStateRules(s).stateName,
            }))}
          />
        </Field>
        <Field label="Down payment" htmlFor="downPayment" className="min-w-0">
          <NumberInput
            id="downPayment"
            unit="cents"
            value={downPaymentCents}
            onChange={setDownPaymentEdit}
            min={0}
            max={estimate.totals.totalCents}
            step={10000}
          />
        </Field>
        <Field label="Contractor" htmlFor="contractorName" className="min-w-0">
          <Input
            id="contractorName"
            placeholder="Your business name"
            value={contractorName}
            onChange={(e) => setContractorName(e.currentTarget.value)}
          />
        </Field>
        <Field label="Owner" htmlFor="ownerName" className="min-w-0">
          <Input
            id="ownerName"
            placeholder="Customer name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.currentTarget.value)}
          />
        </Field>
      </form>

      <div
        className="print-sheet hairline-all rounded-atlas min-w-0 p-4 sm:p-6"
        style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper)" }}
      >
        <WarningStack warnings={warnings} className="mb-4" />

        <header className="hairline-b mb-4 pb-3">
          <p className="micro-label">
            Home improvement contract — {stateRules.stateName} template
          </p>
          <h2>
            {tradeRules.label} — {formatCents(estimate.totals.totalCents)}
          </h2>
          <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            Contractor: {contractorName || "____________________"} · Owner:{" "}
            {ownerName || "____________________"}
            {selection.licenseDisplayRequired ? (
              <>
                {" "}
                · License / registration #: ____________ (display required in{" "}
                {stateRules.stateName})
              </>
            ) : null}
          </p>
        </header>

        <section className="mb-6">
          <h3 className="mb-2">1. Scope of work</h3>
          <LedgerTable
            caption={`Scope of work: ${scopeRows.length} line items carried over from the takeoff sheet`}
            columns={[
              { id: "item", label: "Item" },
              { id: "qty", label: "Qty", numeric: true },
              { id: "unit", label: "Unit" },
            ]}
            rows={scopeRows}
          />
        </section>

        <section className="mb-6">
          <h3 className="mb-2">2. Price and payment</h3>
          <FactTable
            caption="Contract price and payment facts"
            rows={[
              { key: "Contract price", value: formatCents(estimate.totals.totalCents) },
              { key: "Down payment", value: formatCents(downPaymentCents) },
              {
                key: "Balance on completion",
                value: formatCents(estimate.totals.totalCents - downPaymentCents),
              },
              {
                key: `${stateRules.stateName} written-contract threshold`,
                value:
                  selection.homeImprovementThresholdCents > 0
                    ? usd(selection.homeImprovementThresholdCents)
                    : "None stated",
              },
              {
                key: "This job is over that threshold",
                value: selection.overThreshold ? "Yes" : "No",
                mono: false,
              },
            ]}
          />
          <p className="text-dim mt-2" style={{ fontSize: "var(--text-step--1)" }}>
            Remaining payments are scheduled against work performed and materials delivered.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="mb-2">
            3. Clauses {stateRules.stateName} law requires for this job
          </h3>
          <LedgerTable
            caption={`${clauseRows.length} clauses selected deterministically from ${stateRules.stateName} rules and this job's facts`}
            columns={[
              { id: "clause", label: "Clause" },
              { id: "statute", label: "Statute" },
            ]}
            rows={clauseRows}
          />
        </section>

        {selection.prohibitedTerms.length > 0 ? (
          <section className="mb-6">
            <h3 className="mb-2">4. Terms {stateRules.stateName} does not allow</h3>
            <ul className="text-dim ml-5 list-disc" style={{ fontSize: "var(--text-step--1)" }}>
              {selection.prohibitedTerms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <div className="pb-10" style={{ borderBottom: "1px solid var(--ink)" }} />
            <p className="micro-label mt-1">Contractor signature · date</p>
          </div>
          <div>
            <div className="pb-10" style={{ borderBottom: "1px solid var(--ink)" }} />
            <p className="micro-label mt-1">Owner signature · date</p>
          </div>
        </section>

        <footer
          className="hairline-t text-dim mt-6 pt-3"
          style={{ fontSize: "var(--text-step--2)" }}
        >
          <p style={{ maxWidth: "var(--measure)" }}>
            Ruleset <span className="num">{selection.ruleSetVersion}</span>. Clauses were
            selected from this job&apos;s facts — total{" "}
            <span className="num">{formatCents(estimate.totals.totalCents)}</span>, down
            payment <span className="num">{formatCents(downPaymentCents)}</span>. Sources:{" "}
            {selection.citations.map((c, i) => (
              <span key={c.label}>
                {c.label}
                <SourceCitation
                  index={i + 1}
                  label={c.label}
                  url={c.url}
                  lastVerified={c.lastVerified}
                />
                {i < selection.citations.length - 1 ? " · " : ""}
              </span>
            ))}
            . This is a template, not legal advice.
          </p>
        </footer>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        <Button className="touch-lg" onClick={() => window.print()}>
          Print this contract
        </Button>
        <Link href={`/contracts/${stateRules.stateId}`}>
          <Button variant="secondary" className="touch-lg">
            What {stateRules.stateName} requires
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="touch-lg">
            Back to the sheet
          </Button>
        </Link>
      </div>
    </div>
  );
}
