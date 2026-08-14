"use client";

/**
 * The invoice: the same sheet, re-headed. It mirrors the takeoff line for line
 * and matches the estimate total to the cent — which is the whole promise, so
 * the reconciliation is stated on the document and shown in a trace rather
 * than asserted in marketing copy.
 */

import { useMemo, useState } from "react";
import Link from "next/link";

import { estimateToInvoice, getTradeRules, REGION_LABELS } from "@engine";

import {
  Button,
  EmptyState,
  Field,
  HeroNumber,
  Input,
  LedgerTable,
  NumberInput,
  TraceDisclosure,
  WarningStack,
  type LedgerRow,
  type Warning,
} from "@/components/ui";
import { formatCents, formatDate } from "@/lib/format";
import { useStoredEstimate } from "@/lib/store";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function InvoiceView() {
  /* `undefined` = still hydrating. Rendering nothing for that one pass is why
     a returning user never sees the empty state flash before their sheet. */
  const estimate = useStoredEstimate();

  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [issuedDate, setIssuedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [dueInDays, setDueInDays] = useState(14);
  const [depositCents, setDepositCents] = useState(0);

  const invoice = useMemo(() => {
    if (!estimate || !ISO_DATE.test(issuedDate)) return null;
    try {
      return estimateToInvoice(estimate, {
        invoiceNumber: invoiceNumber.trim() || "INV-001",
        issuedDate,
        dueInDays: Math.max(0, Math.round(dueInDays)),
        depositCents: Math.min(Math.max(depositCents, 0), estimate.totals.totalCents),
      });
    } catch {
      return null;
    }
  }, [estimate, invoiceNumber, issuedDate, dueInDays, depositCents]);

  if (estimate === undefined) return null;

  if (!estimate || !invoice) {
    return (
      <EmptyState
        heading="No job on the sheet yet"
        message="The invoice mirrors your takeoff line for line, so it needs an estimate first. Building one takes about a minute."
        action={
          <Link href="/">
            <Button className="touch-lg">Price a job</Button>
          </Link>
        }
      />
    );
  }

  const rules = getTradeRules(estimate.job.trade);

  /* The estimate carried this warning; the invoice is the document that
     actually goes to the customer and becomes a demand for money, so it
     carries it again rather than assuming they remember. */
  const warnings: Warning[] = [
    {
      id: "placeholder-pricing",
      severity: "irreversible",
      label: "Unverified pricing",
      title: <>The amounts below came from placeholder reference pricing.</>,
      body: (
        <>
          An invoice is a demand for a specific number. Confirm every line against what the
          job actually cost you before you send it.
        </>
      ),
    },
  ];

  const rows: LedgerRow[] = [
    ...invoice.lines.map((line, i) => ({
      id: `${line.description}-${i}`,
      cells: {
        description: line.description,
        qty: line.qty,
        unit: <span className="text-dim">{line.unit}</span>,
        amount: formatCents(line.amountCents),
      },
    })),
    {
      id: "overhead-profit",
      cells: {
        description: "Overhead & profit",
        qty: 1,
        unit: <span className="text-dim">job</span>,
        amount: formatCents(invoice.overheadProfitCents),
      },
    },
  ];

  return (
    <div className="space-y-6">
      <form
        className="no-print grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Invoice details"
        onSubmit={(e) => e.preventDefault()}
      >
        <Field label="Invoice number" htmlFor="invoiceNumber" className="min-w-0">
          <Input
            id="invoiceNumber"
            className="num text-right"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
          />
        </Field>
        <Field
          label="Issued"
          htmlFor="issuedDate"
          hint={<span className="num">{formatDate(issuedDate)}</span>}
          className="min-w-0"
        >
          <Input
            id="issuedDate"
            type="date"
            className="num"
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.currentTarget.value)}
          />
        </Field>
        <Field label="Due in (days)" htmlFor="dueInDays" className="min-w-0">
          <NumberInput
            id="dueInDays"
            unit="count"
            value={dueInDays}
            onChange={setDueInDays}
            min={0}
            max={365}
            step={7}
          />
        </Field>
        <Field label="Deposit received" htmlFor="deposit" className="min-w-0">
          <NumberInput
            id="deposit"
            unit="cents"
            value={depositCents}
            onChange={setDepositCents}
            min={0}
            max={estimate.totals.totalCents}
            step={10000}
          />
        </Field>
      </form>

      <div
        className="print-sheet hairline-all rounded-atlas min-w-0 p-4 sm:p-6"
        style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper)" }}
      >
        <header className="hairline-b mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pb-3">
          <div className="min-w-0">
            <p className="micro-label">Invoice</p>
            <h2>
              {rules.label} — <span className="num">{invoice.invoiceNumber}</span>
            </h2>
            <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              {REGION_LABELS[estimate.job.inputs.region]} · issued{" "}
              <span className="num">{formatDate(invoice.issuedDate)}</span> · due{" "}
              <span className="num">{formatDate(invoice.dueDate)}</span>
            </p>
          </div>
          <HeroNumber
            label="Balance due"
            value={invoice.balanceDueCents}
            format={formatCents}
            tween
          />
        </header>

        <WarningStack warnings={warnings} className="mb-4" />

        <LedgerTable
          caption={`Invoice ${invoice.invoiceNumber}: ${rows.length} lines, mirroring the takeoff sheet`}
          columns={[
            { id: "description", label: "Description" },
            { id: "qty", label: "Qty", numeric: true },
            { id: "unit", label: "Unit" },
            { id: "amount", label: "Amount", numeric: true },
          ]}
          rows={rows}
        />

        <dl
          className="density-instrument mt-4 ml-auto flex max-w-xs flex-col gap-1"
          style={{ fontSize: "var(--text-step--1)" }}
        >
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-dim">Total</dt>
            <dd className="num num-cell text-ink">{formatCents(invoice.totalCents)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-dim">Deposit received</dt>
            <dd className="num num-cell text-ink">
              {invoice.depositCents === 0 ? formatCents(0) : formatCents(-invoice.depositCents)}
            </dd>
          </div>
          <div
            className="mt-1 flex items-baseline justify-between gap-4 pt-2"
            style={{ borderTop: "2px solid var(--ink)" }}
          >
            <dt style={{ fontWeight: 600 }}>Balance due</dt>
            <dd className="num num-cell" style={{ fontWeight: 600 }}>
              {formatCents(invoice.balanceDueCents)}
            </dd>
          </div>
        </dl>

        <footer
          className="hairline-t text-dim mt-6 pt-3"
          style={{ fontSize: "var(--text-step--2)" }}
        >
          <p style={{ maxWidth: "var(--measure)" }}>
            Built from estimate ruleset{" "}
            <span className="num">{invoice.ruleSetVersion}</span>. Prices carried over from
            the takeoff sheet are placeholder reference data, not market quotes.
          </p>
          <div className="no-print mt-2">
            <TraceDisclosure
              summaryLabel="How the invoice total reconciles to the estimate"
              formula="invoice total = estimate total; balance due = total − deposit"
              inputs={[
                { label: "Estimate total", value: formatCents(invoice.sourceEstimateTotalCents) },
                { label: "Invoice total", value: formatCents(invoice.totalCents) },
                { label: "Line subtotal", value: formatCents(invoice.subtotalCents) },
                { label: "Overhead & profit", value: formatCents(invoice.overheadProfitCents) },
                { label: "Deposit received", value: formatCents(invoice.depositCents) },
                { label: "Balance due", value: formatCents(invoice.balanceDueCents) },
              ]}
              ruleVersion={invoice.ruleSetVersion}
              citation={{
                label: "JobPaper pricing methodology",
                url: "/pricing-methodology",
                lastVerified: estimate.rulesLastVerified,
              }}
            />
          </div>
        </footer>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        <Button className="touch-lg" onClick={() => window.print()}>
          Print this invoice
        </Button>
        <Link href="/contract">
          <Button variant="secondary" className="touch-lg">
            Create the contract
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
