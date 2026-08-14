import { describe, expect, it } from "vitest";

import { buildEstimate, computeTotals, rulesAreStale } from "../src/estimate";
import { getTradeRules } from "../src/rules";
import type { Job, LineItem } from "../src/types";

const deckJob: Job = {
  trade: "decks",
  jobType: "new-deck",
  inputs: {
    dimensions: { lengthFt: 16, widthFt: 12, railingLinearFt: 40, stairSteps: 4 },
    grade: "mid",
    access: "standard",
    region: "southeast",
  },
};

const rules = getTradeRules("decks");

describe("estimate: totals math", () => {
  it("sums materials + labor, then overhead on subtotal, then profit on (subtotal + overhead)", () => {
    const lines: LineItem[] = [
      {
        id: "a",
        assemblyId: "a",
        description: "A",
        qty: 10,
        unit: "sq ft",
        unitCostCents: 500, // materials $50.00
        laborHours: 2,
        laborRateCents: 6000, // labor $120.00
        basis: "test",
        assumptions: [],
      },
    ];
    const t = computeTotals(lines, 1000, 1500);
    expect(t.materialsCents).toBe(5000);
    expect(t.laborCents).toBe(12000);
    expect(t.subtotalCents).toBe(17000);
    expect(t.overheadCents).toBe(1700); // 10%
    expect(t.profitCents).toBe(2805); // 15% of 18,700
    expect(t.totalCents).toBe(21505);
  });

  it("matches the hand-computed 12x16 mid-grade southeast deck to the cent", () => {
    const est = buildEstimate(rules, deckJob, { asOf: "2026-08-08" });
    expect(est.totals.materialsCents).toBe(403221);
    expect(est.totals.laborCents).toBe(341555);
    expect(est.totals.subtotalCents).toBe(744776);
    expect(est.totals.totalCents).toBe(942142);
  });
});

describe("estimate: ranges, not points", () => {
  it("returns a low-high range bracketing the computed total", () => {
    const est = buildEstimate(rules, deckJob, { asOf: "2026-08-08" });
    expect(est.range.lowCents).toBeLessThan(est.totals.totalCents);
    expect(est.range.highCents).toBeGreaterThan(est.totals.totalCents);
    expect(est.range.lowCents).toBe(847928); // total x 0.90
    expect(est.range.highCents).toBe(1111728); // total x 1.18
  });
});

describe("estimate: grade tiers and defaults", () => {
  it("premium grade costs more than mid, which costs more than economy", () => {
    const grades = (["economy", "mid", "premium"] as const).map(
      (grade) =>
        buildEstimate(
          rules,
          { ...deckJob, inputs: { ...deckJob.inputs, grade } },
          { asOf: "2026-08-08" },
        ).totals.totalCents,
    );
    expect(grades[0]).toBeLessThan(grades[1] ?? 0);
    expect(grades[1]).toBeLessThan(grades[2] ?? 0);
  });

  it("uses taught defaults for overhead and profit, overridable by the user", () => {
    const est = buildEstimate(rules, deckJob, { asOf: "2026-08-08" });
    expect(est.overheadBps).toBe(1000);
    expect(est.profitBps).toBe(1500);
    const custom = buildEstimate(rules, deckJob, {
      asOf: "2026-08-08",
      overheadBps: 2000,
      profitBps: 2000,
    });
    expect(custom.totals.totalCents).toBeGreaterThan(est.totals.totalCents);
  });
});

describe("estimate: stale-rules flag", () => {
  it("is fresh within the stale window and stale after it", () => {
    expect(rulesAreStale(rules, "2026-08-08")).toBe(false);
    expect(rulesAreStale(rules, "2027-06-01")).toBe(true);
    const staleEst = buildEstimate(rules, deckJob, { asOf: "2027-06-01" });
    expect(staleEst.staleRules).toBe(true);
  });

  it("rejects a job whose trade does not match the rules", () => {
    expect(() =>
      buildEstimate(rules, { ...deckJob, trade: "interior-paint" }, { asOf: "2026-08-08" }),
    ).toThrow(/does not match/);
  });
});
