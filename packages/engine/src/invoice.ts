/**
 * Estimate -> invoice. The invoice's total MUST equal the estimate's total,
 * to the cent — the overhead/profit margin is carried as one explicit
 * "Overhead & profit" line so the client-facing document adds up exactly.
 */

import { lineTotalCents } from "./assemblies";
import { assertCents } from "./money";
import type { Estimate, Invoice, InvoiceLine } from "./types";

export interface InvoiceOptions {
  invoiceNumber: string;
  /** ISO date, e.g. "2026-08-08". */
  issuedDate: string;
  dueInDays: number;
  depositCents?: number;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function estimateToInvoice(estimate: Estimate, options: InvoiceOptions): Invoice {
  const depositCents = assertCents(options.depositCents ?? 0, "depositCents");
  if (depositCents < 0) throw new Error("depositCents must be >= 0");
  if (depositCents > estimate.totals.totalCents) {
    throw new Error("Deposit cannot exceed the invoice total");
  }

  const lines: InvoiceLine[] = estimate.lineItems.map((item) => ({
    description: item.description,
    qty: item.qty,
    unit: item.unit,
    amountCents: lineTotalCents(item),
  }));

  const subtotalCents = lines.reduce((sum, l) => sum + l.amountCents, 0);
  // Carry margin as an explicit line so invoice total === estimate total.
  const overheadProfitCents = estimate.totals.totalCents - subtotalCents;
  const totalCents = subtotalCents + overheadProfitCents;

  return {
    invoiceNumber: options.invoiceNumber,
    issuedDate: options.issuedDate,
    dueDate: addDays(options.issuedDate, options.dueInDays),
    lines,
    subtotalCents,
    overheadProfitCents,
    totalCents,
    depositCents,
    balanceDueCents: totalCents - depositCents,
    sourceEstimateTotalCents: estimate.totals.totalCents,
    ruleSetVersion: estimate.ruleSetVersion,
  };
}
