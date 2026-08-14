"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import {
  estimateToInvoice,
  formatCents,
  getTradeRules,
  REGION_LABELS,
  type Estimate,
} from "@engine";

import { loadEstimate } from "@/lib/store";

interface InvoiceFormValues {
  invoiceNumber: string;
  issuedDate: string;
  dueInDays: number;
  depositDollars: number;
}

export default function InvoiceView() {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEstimate(loadEstimate());
    setLoaded(true);
  }, []);

  const { register, watch } = useForm<InvoiceFormValues>({
    mode: "onChange",
    defaultValues: {
      invoiceNumber: "INV-001",
      issuedDate: new Date().toISOString().slice(0, 10),
      dueInDays: 14,
      depositDollars: 0,
    },
  });
  const values = watch();

  const invoice = useMemo(() => {
    if (!estimate) return null;
    const deposit = Number.isFinite(values.depositDollars)
      ? Math.round(values.depositDollars * 100)
      : 0;
    const issued = /^\d{4}-\d{2}-\d{2}$/.test(values.issuedDate)
      ? values.issuedDate
      : new Date().toISOString().slice(0, 10);
    try {
      return estimateToInvoice(estimate, {
        invoiceNumber: values.invoiceNumber || "INV-001",
        issuedDate: issued,
        dueInDays: Number.isFinite(values.dueInDays) ? Math.max(0, Math.round(values.dueInDays)) : 14,
        depositCents: Math.min(Math.max(deposit, 0), estimate.totals.totalCents),
      });
    } catch {
      return null;
    }
  }, [estimate, values]);

  if (!loaded) return null;

  if (!estimate) {
    return (
      <div className="rounded border border-rule bg-sheet p-8 text-center">
        <p className="mb-4">No estimate yet — the invoice mirrors your takeoff sheet.</p>
        <Link
          href="/"
          className="btn inline-flex items-center rounded bg-signal px-4 py-2.5 font-semibold text-white"
        >
          Build your estimate
        </Link>
      </div>
    );
  }

  const rules = getTradeRules(estimate.job.trade);
  const inputClass = "w-full rounded border border-rule bg-sheet px-3 py-2 num";

  return (
    <div className="space-y-6">
      <form
        className="no-print grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="Invoice details"
      >
        <div>
          <label htmlFor="invoiceNumber" className="mb-1 block text-sm font-semibold">
            Invoice #
          </label>
          <input id="invoiceNumber" className={inputClass} {...register("invoiceNumber")} />
        </div>
        <div>
          <label htmlFor="issuedDate" className="mb-1 block text-sm font-semibold">
            Issue date
          </label>
          <input
            id="issuedDate"
            type="date"
            className={inputClass}
            {...register("issuedDate")}
          />
        </div>
        <div>
          <label htmlFor="dueInDays" className="mb-1 block text-sm font-semibold">
            Due in (days)
          </label>
          <input
            id="dueInDays"
            type="number"
            min={0}
            className={inputClass}
            {...register("dueInDays", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label htmlFor="depositDollars" className="mb-1 block text-sm font-semibold">
            Deposit received ($)
          </label>
          <input
            id="depositDollars"
            type="number"
            min={0}
            step={0.01}
            className={inputClass}
            {...register("depositDollars", { valueAsNumber: true })}
          />
        </div>
      </form>

      {invoice ? (
        <div className="print-sheet max-w-3xl rounded border border-rule bg-sheet p-4 shadow-sm sm:p-6">
          <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-3">
            <div>
              <p className="text-xs font-semibold tracking-widest text-dim">INVOICE</p>
              <h1 className="text-xl font-bold">
                {rules.label} — <span className="num">{invoice.invoiceNumber}</span>
              </h1>
              <p className="text-sm text-dim">
                {REGION_LABELS[estimate.job.inputs.region]} · issued{" "}
                <span className="num">{invoice.issuedDate}</span> · due{" "}
                <span className="num">{invoice.dueDate}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-dim">Balance due</p>
              <p className="num text-2xl font-bold">{formatCents(invoice.balanceDueCents)}</p>
            </div>
          </header>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-xs uppercase tracking-wide text-dim">
                <th scope="col" className="py-2 pe-2 font-semibold">
                  Description
                </th>
                <th scope="col" className="w-20 px-1 py-2 text-right font-semibold">
                  Qty
                </th>
                <th scope="col" className="w-20 px-1 py-2 font-semibold">
                  Unit
                </th>
                <th scope="col" className="w-28 ps-1 py-2 text-right font-semibold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, i) => (
                <tr key={`${line.description}-${i}`} className="takeoff-row">
                  <td className="py-2 pe-2">{line.description}</td>
                  <td className="num px-1 py-2 text-right">{line.qty}</td>
                  <td className="px-1 py-2 text-xs text-dim">{line.unit}</td>
                  <td className="num ps-1 py-2 text-right">{formatCents(line.amountCents)}</td>
                </tr>
              ))}
              <tr className="takeoff-row">
                <td className="py-2 pe-2">Overhead &amp; profit</td>
                <td className="num px-1 py-2 text-right">1</td>
                <td className="px-1 py-2 text-xs text-dim">job</td>
                <td className="num ps-1 py-2 text-right">
                  {formatCents(invoice.overheadProfitCents)}
                </td>
              </tr>
            </tbody>
          </table>

          <dl className="ms-auto mt-4 max-w-xs space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-dim">Total</dt>
              <dd className="num">{formatCents(invoice.totalCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-dim">Deposit received</dt>
              <dd className="num">−{formatCents(invoice.depositCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t-2 border-ink pt-2 text-base font-bold">
              <dt>Balance due</dt>
              <dd className="num">{formatCents(invoice.balanceDueCents)}</dd>
            </div>
          </dl>

          <footer className="mt-6 border-t border-rule pt-3 text-xs text-dim">
            <p>
              Generated from estimate ruleset {invoice.ruleSetVersion}. Invoice total matches
              the estimate total of{" "}
              <span className="num">{formatCents(invoice.sourceEstimateTotalCents)}</span> to
              the cent.
            </p>
          </footer>
        </div>
      ) : null}

      <div className="no-print flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-signal px-4 py-2.5 font-semibold text-white"
        >
          Print invoice
        </button>
        <Link
          href="/"
          className="btn inline-flex items-center rounded border border-rule px-4 py-2.5 font-semibold"
        >
          Back to estimate
        </Link>
        <Link
          href="/contract"
          className="btn inline-flex items-center rounded border-2 border-signal px-4 py-2.5 font-semibold text-signal"
        >
          Create state contract
        </Link>
      </div>
    </div>
  );
}
