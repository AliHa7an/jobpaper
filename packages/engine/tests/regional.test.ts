import { describe, expect, it } from "vitest";

import { buildEstimate } from "../src/estimate";
import { applyRegional, regionalMultiplierBps } from "../src/regional";
import { getTradeRules } from "../src/rules";
import type { Job } from "../src/types";

const rules = getTradeRules("decks");

const job = (region: Job["inputs"]["region"]): Job => ({
  trade: "decks",
  jobType: "new-deck",
  inputs: {
    dimensions: { lengthFt: 16, widthFt: 12, railingLinearFt: 40, stairSteps: 4 },
    grade: "mid",
    access: "standard",
    region,
  },
});

describe("regional multipliers", () => {
  it("applies the region's bps multiplier to a cost", () => {
    expect(regionalMultiplierBps(rules, "pacific")).toBe(12500);
    expect(applyRegional(10000, rules, "pacific")).toBe(12500);
    expect(applyRegional(10000, rules, "southeast")).toBe(9200);
  });

  it("makes the same deck cost more in the pacific than the southeast", () => {
    const se = buildEstimate(rules, job("southeast"), { asOf: "2026-08-08" });
    const pac = buildEstimate(rules, job("pacific"), { asOf: "2026-08-08" });
    expect(pac.totals.totalCents).toBeGreaterThan(se.totals.totalCents);
    expect(pac.regionalMultiplierBps).toBe(12500);
    expect(se.regionalMultiplierBps).toBe(9200);
  });

  it("every launch trade defines a multiplier for every region", () => {
    const regions = [
      "northeast",
      "southeast",
      "midwest",
      "south-central",
      "mountain-west",
      "pacific",
    ] as const;
    for (const trade of ["decks", "interior-paint", "bathroom-remodel"] as const) {
      const tr = getTradeRules(trade);
      for (const region of regions) {
        expect(Number.isInteger(tr.regionalMultipliersBps[region])).toBe(true);
      }
    }
  });
});
