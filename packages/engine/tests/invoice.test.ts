import { describe, expect, it } from "vitest";

import { buildEstimate } from "../src/estimate";
import { estimateToInvoice } from "../src/invoice";
import { getTradeRules } from "../src/rules";
import type { Job } from "../src/types";

const job: Job = {
  trade: "bathroom-remodel",
  jobType: "full-remodel",
  inputs: {
    dimensions: { lengthFt: 8, widthFt: 5, showerTileSqFt: 60, replaceTubShower: 1 },
    grade: "mid",
    access: "standard",
    region: "midwest",
  },
};

const rules = getTradeRules("bathroom-remodel");
const estimate = buildEstimate(rules, job, { asOf: "2026-08-08" });

describe("invoice: matches its estimate", () => {
  const invoice = estimateToInvoice(estimate, {
    invoiceNumber: "INV-001",
    issuedDate: "2026-08-08",
    dueInDays: 14,
    depositCents: 100_000,
  });

  it("totals exactly the estimate total, to the cent", () => {
    expect(invoice.totalCents).toBe(estimate.totals.totalCents);
    expect(invoice.sourceEstimateTotalCents).toBe(estimate.totals.totalCents);
    expect(invoice.subtotalCents + invoice.overheadProfitCents).toBe(invoice.totalCents);
  });

  it("carries one invoice line per estimate line item", () => {
    expect(invoice.lines.length).toBe(estimate.lineItems.length);
    expect(invoice.lines.every((l) => Number.isInteger(l.amountCents))).toBe(true);
  });

  it("computes balance due and due date", () => {
    expect(invoice.balanceDueCents).toBe(invoice.totalCents - 100_000);
    expect(invoice.dueDate).toBe("2026-08-22");
  });

  it("rejects a deposit exceeding the total", () => {
    expect(() =>
      estimateToInvoice(estimate, {
        invoiceNumber: "INV-002",
        issuedDate: "2026-08-08",
        dueInDays: 14,
        depositCents: estimate.totals.totalCents + 1,
      }),
    ).toThrow(/Deposit cannot exceed/);
  });
});
