import { describe, expect, it } from "vitest";

import { evaluateTrigger, selectClauses } from "../src/contracts";
import { getStateRules, STATE_IDS } from "../src/rules";

describe("contracts: CA downpayment cap — min($1000, 10%)", () => {
  const ca = getStateRules("CA");

  it("triggers when the down payment exceeds the lesser of $1,000 and 10%", () => {
    // $20,000 job: cap = min($1,000, $2,000) = $1,000. $1,500 exceeds it.
    const sel = selectClauses(ca, { totalCents: 2_000_000, downPaymentCents: 150_000 });
    expect(sel.clauses.map((c) => c.id)).toContain("downpayment-cap");
  });

  it("does not trigger when the down payment is within the cap", () => {
    const sel = selectClauses(ca, { totalCents: 2_000_000, downPaymentCents: 50_000 });
    expect(sel.clauses.map((c) => c.id)).not.toContain("downpayment-cap");
  });

  it("uses the 10% leg when the job is small", () => {
    // $6,000 job: cap = min($1,000, $600) = $600. $700 exceeds it.
    const r = evaluateTrigger(
      "downpayment > min($1000, 10%)",
      { totalCents: 600_000, downPaymentCents: 70_000 },
      ca.homeImprovementThresholdCents,
    );
    expect(r.triggered).toBe(true);
  });
});

describe("contracts: threshold and total triggers", () => {
  it("selects always-on clauses regardless of facts", () => {
    const ca = getStateRules("CA");
    const sel = selectClauses(ca, { totalCents: 10_000, downPaymentCents: 0 });
    const ids = sel.clauses.map((c) => c.id);
    expect(ids).toContain("right-to-cancel");
    expect(ids).toContain("mechanics-lien-warning");
  });

  it("applies 'total >= threshold' against the state threshold", () => {
    const ca = getStateRules("CA");
    const below = selectClauses(ca, { totalCents: 40_000, downPaymentCents: 0 });
    const above = selectClauses(ca, { totalCents: 60_000, downPaymentCents: 0 });
    expect(below.clauses.map((c) => c.id)).not.toContain("written-contract");
    expect(above.clauses.map((c) => c.id)).toContain("written-contract");
    expect(below.overThreshold).toBe(false);
    expect(above.overThreshold).toBe(true);
  });

  it("applies 'total > $N' triggers (TX bills-paid affidavit over $5,000)", () => {
    const tx = getStateRules("TX");
    const small = selectClauses(tx, { totalCents: 400_000, downPaymentCents: 0 });
    const large = selectClauses(tx, { totalCents: 600_000, downPaymentCents: 0 });
    expect(small.clauses.map((c) => c.id)).not.toContain("final-bills-paid-affidavit");
    expect(large.clauses.map((c) => c.id)).toContain("final-bills-paid-affidavit");
  });

  it("applies percentage down payment caps (PA one-third rule)", () => {
    const pa = getStateRules("PA");
    const over = selectClauses(pa, { totalCents: 900_000, downPaymentCents: 400_000 });
    const under = selectClauses(pa, { totalCents: 900_000, downPaymentCents: 200_000 });
    expect(over.clauses.map((c) => c.id)).toContain("downpayment-cap");
    expect(under.clauses.map((c) => c.id)).not.toContain("downpayment-cap");
  });

  it("applies 'downpayment > 0' triggers (NY escrow notice)", () => {
    const ny = getStateRules("NY");
    const withDeposit = selectClauses(ny, { totalCents: 800_000, downPaymentCents: 10_000 });
    const noDeposit = selectClauses(ny, { totalCents: 800_000, downPaymentCents: 0 });
    expect(withDeposit.clauses.map((c) => c.id)).toContain("deposit-escrow");
    expect(noDeposit.clauses.map((c) => c.id)).not.toContain("deposit-escrow");
  });
});

describe("contracts: safety rails", () => {
  it("throws on an unsupported trigger expression instead of guessing", () => {
    expect(() =>
      evaluateTrigger("moon is full", { totalCents: 1, downPaymentCents: 0 }, 0),
    ).toThrow(/Unsupported clause trigger/);
  });

  it("every launch state's triggers parse against sample facts", () => {
    for (const stateId of STATE_IDS) {
      const rules = getStateRules(stateId);
      expect(() =>
        selectClauses(rules, { totalCents: 1_250_000, downPaymentCents: 200_000 }),
      ).not.toThrow();
    }
  });

  it("every clause carries a statute citation and unverified marker", () => {
    for (const stateId of STATE_IDS) {
      for (const clause of getStateRules(stateId).requiredClauses) {
        expect(clause.statute.length).toBeGreaterThan(0);
        expect(clause.text).toContain("UNVERIFIED — ATTORNEY REVIEW REQUIRED");
      }
    }
  });
});
