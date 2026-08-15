import { describe, expect, it } from "vitest";

import {
  canGenerateContract,
  ContractBlockedError,
  evaluateTrigger,
  selectClauses,
  untranscribedClauses,
} from "../src/contracts";
import { getStateRules, STATE_IDS } from "../src/rules";

/*
 * WHY SO MANY OF THESE NOW USE evaluateTrigger DIRECTLY.
 *
 * As of the 2026-08-15 verification pass, CA, TX, FL and NY each carry at least
 * one clause whose wording the statute prescribes and which has not been
 * transcribed. selectClauses() therefore throws ContractBlockedError for those
 * four states, so trigger-grammar coverage that used to run through
 * selectClauses(CA/TX/FL) is exercised through evaluateTrigger instead. The
 * grammar being tested is unchanged; only the entry point moved.
 *
 * PA is the one launch state that still generates, so it carries the
 * end-to-end selectClauses coverage.
 */

describe("contracts: CA downpayment cap — min($1000, 10%)", () => {
  const ca = getStateRules("CA");

  it("triggers when the down payment exceeds the lesser of $1,000 and 10%", () => {
    // $20,000 job: cap = min($1,000, $2,000) = $1,000. $1,500 exceeds it.
    const r = evaluateTrigger(
      "downpayment > min($1000, 10%)",
      { totalCents: 2_000_000, downPaymentCents: 150_000 },
      ca.homeImprovementThresholdCents,
    );
    expect(r.triggered).toBe(true);
  });

  it("does not trigger when the down payment is within the cap", () => {
    const r = evaluateTrigger(
      "downpayment > min($1000, 10%)",
      { totalCents: 2_000_000, downPaymentCents: 50_000 },
      ca.homeImprovementThresholdCents,
    );
    expect(r.triggered).toBe(false);
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

  it("still carries the cap as a required CA clause", () => {
    const ids = ca.requiredClauses.map((c) => c.id);
    expect(ids).toContain("downpayment-cap");
  });
});

describe("contracts: threshold and total triggers", () => {
  it("selects always-on clauses regardless of facts", () => {
    // Moved from CA to PA: CA no longer generates. PA's always-on clause is the
    // registration-number display requirement (73 P.S. §517.7(a)(1)).
    const pa = getStateRules("PA");
    const sel = selectClauses(pa, { totalCents: 10_000, downPaymentCents: 0 });
    expect(sel.clauses.map((c) => c.id)).toContain("registration-number");
  });

  it("applies 'total >= threshold' against the state threshold", () => {
    const pa = getStateRules("PA");
    // PA's home-improvement threshold is $500 (73 P.S. §517.2).
    const below = selectClauses(pa, { totalCents: 40_000, downPaymentCents: 0 });
    const above = selectClauses(pa, { totalCents: 60_000, downPaymentCents: 0 });
    expect(below.clauses.map((c) => c.id)).not.toContain("hicpa-contract-contents");
    expect(above.clauses.map((c) => c.id)).toContain("hicpa-contract-contents");
    expect(below.overThreshold).toBe(false);
    expect(above.overThreshold).toBe(true);
  });

  it("applies 'total > $N' triggers (FL recovery fund notice over $2,500)", () => {
    // Was the TX bills-paid affidavit at $5,000. That threshold has been removed
    // (see below), so the `total > $N` grammar is covered by the FL clause that
    // legitimately carries a dollar figure: §489.1425 does not apply where the
    // value of labour and materials does not exceed $2,500.
    const fl = getStateRules("FL");
    const t = "total > $2,500";
    expect(
      evaluateTrigger(t, { totalCents: 240_000, downPaymentCents: 0 }, fl.homeImprovementThresholdCents)
        .triggered,
    ).toBe(false);
    expect(
      evaluateTrigger(t, { totalCents: 260_000, downPaymentCents: 0 }, fl.homeImprovementThresholdCents)
        .triggered,
    ).toBe(true);
  });

  it("applies 'downpayment > 0' triggers (NY escrow notice)", () => {
    // NY no longer generates, so the grammar is checked directly.
    const ny = getStateRules("NY");
    const escrow = ny.requiredClauses.find((c) => c.id === "deposit-escrow");
    expect(escrow?.trigger).toBe("downpayment > 0");
    const withDeposit = evaluateTrigger(
      "downpayment > 0",
      { totalCents: 800_000, downPaymentCents: 10_000 },
      ny.homeImprovementThresholdCents,
    );
    const noDeposit = evaluateTrigger(
      "downpayment > 0",
      { totalCents: 800_000, downPaymentCents: 0 },
      ny.homeImprovementThresholdCents,
    );
    expect(withDeposit.triggered).toBe(true);
    expect(noDeposit.triggered).toBe(false);
  });
});

describe("contracts: PA down payment cap — 73 P.S. §517.9", () => {
  const pa = getStateRules("PA");
  const clause = pa.requiredClauses.find((c) => c.id === "downpayment-cap");

  /*
   * CHANGED EXPECTATION. This suite used to assert `downpayment > 33%` fired on
   * a $9,000 job with a $4,000 deposit and not with a $2,000 one. Both the cite
   * and the trigger were wrong:
   *
   *  - the cap is in §517.9 (prohibited acts), not §517.7(e), which contains no
   *    down payment limit at all;
   *  - it applies only to contracts with a total price of MORE THAN $5,000, so a
   *    $9,000 job is in scope but a $4,000 one is not — the old trigger fired on
   *    contracts where no cap exists;
   *  - the cap is one-third, not 33%, and it is one-third PLUS the cost of
   *    special-order materials.
   *
   * Source: VERIFICATION-STATUS.md, PA table, `downpayment-cap` rows. The clause
   * PROSE already described the rule correctly; only the machine-readable
   * trigger disagreed with it, which is what these cases now pin down.
   */

  it("encodes the rule its own prose describes", () => {
    expect(clause?.trigger).toBe("total > $5,000 and downpayment > 1/3 + specialOrderMaterials");
    expect(clause?.statute).toBe("73 P.S. §517.9");
  });

  it("does not fire on contracts of $5,000 or less, where no cap applies", () => {
    // $4,000 job, $3,000 deposit — 75%, and lawful, because §517.9's gate is
    // "more than $5,000". The old 33% trigger fired here; that was a false alarm.
    const sel = selectClauses(pa, { totalCents: 400_000, downPaymentCents: 300_000 });
    expect(sel.clauses.map((c) => c.id)).not.toContain("downpayment-cap");
  });

  it("does not fire at exactly $5,000 — the gate is strictly greater", () => {
    const sel = selectClauses(pa, { totalCents: 500_000, downPaymentCents: 500_000 });
    expect(sel.clauses.map((c) => c.id)).not.toContain("downpayment-cap");
  });

  it("fires above $5,000 when the deposit exceeds one-third", () => {
    // $9,000 job: one-third is $3,000. $4,000 exceeds it.
    const sel = selectClauses(pa, { totalCents: 900_000, downPaymentCents: 400_000 });
    expect(sel.clauses.map((c) => c.id)).toContain("downpayment-cap");
  });

  it("does not fire above $5,000 when the deposit is within one-third", () => {
    const sel = selectClauses(pa, { totalCents: 900_000, downPaymentCents: 200_000 });
    expect(sel.clauses.map((c) => c.id)).not.toContain("downpayment-cap");
  });

  it("uses exact thirds, not 33%", () => {
    // $9,000 job. One-third is $3,000.00; 33% is $2,970.00. A $2,990 deposit is
    // lawful and would have tripped the old basis-point approximation.
    const exact = selectClauses(pa, { totalCents: 900_000, downPaymentCents: 299_000 });
    expect(exact.clauses.map((c) => c.id)).not.toContain("downpayment-cap");

    const overByOneCent = selectClauses(pa, { totalCents: 900_000, downPaymentCents: 300_001 });
    expect(overByOneCent.clauses.map((c) => c.id)).toContain("downpayment-cap");
  });

  it("adds special-order materials to the lawful ceiling", () => {
    // $9,000 job with $1,200 of special-order materials: ceiling is
    // $3,000 + $1,200 = $4,200. A $4,000 deposit is lawful.
    const within = selectClauses(pa, {
      totalCents: 900_000,
      downPaymentCents: 400_000,
      specialOrderMaterialsCents: 120_000,
    });
    expect(within.clauses.map((c) => c.id)).not.toContain("downpayment-cap");

    const over = selectClauses(pa, {
      totalCents: 900_000,
      downPaymentCents: 430_000,
      specialOrderMaterialsCents: 120_000,
    });
    expect(over.clauses.map((c) => c.id)).toContain("downpayment-cap");
  });
});

describe("contracts: TX bills-paid affidavit — Tex. Prop. Code §53.259", () => {
  const tx = getStateRules("TX");
  const clause = tx.requiredClauses.find((c) => c.id === "final-bills-paid-affidavit");

  /*
   * CHANGED EXPECTATION. This clause used to carry `total > $5,000` and the old
   * test asserted it did NOT fire on a $4,000 job. That was the bug: §53.259(a)
   * applies "As a condition of final payment under a residential construction
   * contract" with no monetary floor, so the threshold suppressed a required
   * clause on every contract under $5,000. Source: VERIFICATION-STATUS.md, TX
   * table, `final-bills-paid-affidavit` row.
   */

  it("has no dollar threshold", () => {
    expect(clause?.trigger).toBe("always");
  });

  it("fires on a contract well under $5,000", () => {
    const r = evaluateTrigger(
      clause?.trigger ?? "",
      { totalCents: 120_000, downPaymentCents: 0 },
      tx.homeImprovementThresholdCents,
    );
    expect(r.triggered).toBe(true);
  });
});

describe("contracts: fail closed on untranscribed statutory text", () => {
  /*
   * Four of the five launch states prescribe notice wording word-for-word (and
   * TX §53.255 prescribes a "substantially similar" form). None of it has been
   * transcribed, so no contract is produced for those states at all. See
   * VERIFICATION-STATUS.md, "THE HEADLINE FINDING".
   */

  const blockedByState: Record<string, string[]> = {
    NY: ["mechanics-lien-notice"],
    TX: [
      "residential-construction-disclosure-statement",
      "right-to-cancel-solicitation",
      "notice-of-cancellation-form",
    ],
    FL: ["lien-law-notice"],
    CA: ["right-to-cancel", "downpayment-cap", "mechanics-lien-warning", "cslb-notice"],
  };

  for (const [stateId, expectedIds] of Object.entries(blockedByState)) {
    it(`refuses to generate a ${stateId} contract`, () => {
      const rules = getStateRules(stateId as "NY");
      expect(canGenerateContract(rules)).toBe(false);
      expect(untranscribedClauses(rules).map((c) => c.clauseId).sort()).toEqual(
        [...expectedIds].sort(),
      );
      expect(() =>
        selectClauses(rules, { totalCents: 1_250_000, downPaymentCents: 200_000 }),
      ).toThrow(ContractBlockedError);
    });

    it(`names the state, clause, statute and source URL when ${stateId} is refused`, () => {
      const rules = getStateRules(stateId as "NY");
      let caught: unknown;
      try {
        selectClauses(rules, { totalCents: 1_250_000, downPaymentCents: 200_000 });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(ContractBlockedError);
      const err = caught as ContractBlockedError;
      expect(err.stateId).toBe(stateId);
      expect(err.blockers.length).toBe(expectedIds.length);
      expect(err.message).toContain(rules.stateName);
      for (const blocker of err.blockers) {
        expect(err.message).toContain(blocker.clauseId);
        expect(err.message).toContain(blocker.statute);
        expect(err.message).toContain(blocker.sourceUrl);
        expect(blocker.sourceUrl).toMatch(/^https:\/\//);
        expect(blocker.textStatus).not.toBe("DRAFTED");
      }
    });
  }

  it("still generates for PA, which prescribes no verbatim wording", () => {
    const pa = getStateRules("PA");
    expect(canGenerateContract(pa)).toBe(true);
    expect(untranscribedClauses(pa)).toEqual([]);
    expect(() =>
      selectClauses(pa, { totalCents: 1_250_000, downPaymentCents: 200_000 }),
    ).not.toThrow();
  });

  it("blocks on the state, not on the job facts", () => {
    // A tiny FL job would not trigger the $2,500 lien notice, but FL is still
    // refused: a rule that only blocks the jobs it happens to fire on invites
    // the fix "make the job smaller".
    const fl = getStateRules("FL");
    expect(() => selectClauses(fl, { totalCents: 1_000, downPaymentCents: 0 })).toThrow(
      ContractBlockedError,
    );
  });
});

describe("contracts: safety rails", () => {
  it("throws on an unsupported trigger expression instead of guessing", () => {
    expect(() =>
      evaluateTrigger("moon is full", { totalCents: 1, downPaymentCents: 0 }, 0),
    ).toThrow(/Unsupported clause trigger/);
  });

  it("throws when either side of a conjunction is unsupported", () => {
    expect(() =>
      evaluateTrigger(
        "total > $5,000 and moon is full",
        { totalCents: 1_000_000, downPaymentCents: 0 },
        0,
      ),
    ).toThrow(/Unsupported clause trigger/);
  });

  it("every launch state's triggers parse against sample facts", () => {
    // Per clause rather than through selectClauses, which now refuses four of
    // the five states before it reaches any trigger.
    for (const stateId of STATE_IDS) {
      const rules = getStateRules(stateId);
      for (const clause of rules.requiredClauses) {
        expect(() =>
          evaluateTrigger(
            clause.trigger,
            {
              totalCents: 1_250_000,
              downPaymentCents: 200_000,
              specialOrderMaterialsCents: 50_000,
            },
            rules.homeImprovementThresholdCents,
          ),
        ).not.toThrow();
      }
    }
  });

  it("every clause carries a statute citation and a declared text status", () => {
    for (const stateId of STATE_IDS) {
      for (const clause of getStateRules(stateId).requiredClauses) {
        expect(clause.statute.length).toBeGreaterThan(0);
        expect(clause.textStatus).toBeTruthy();
      }
    }
  });

  it("drafted clauses carry the unverified marker; prescribed ones carry no text at all", () => {
    /*
     * CHANGED EXPECTATION. This used to require the "UNVERIFIED — ATTORNEY
     * REVIEW REQUIRED" marker inside EVERY clause text. Clauses whose wording
     * the statute prescribes now carry no text: a marker cannot make a
     * paraphrase of prescribed text compliant, and any string in that field is
     * a string that can be rendered into a signed contract.
     */
    for (const stateId of STATE_IDS) {
      for (const clause of getStateRules(stateId).requiredClauses) {
        if (clause.textStatus === "DRAFTED") {
          expect(clause.text).toContain("UNVERIFIED — ATTORNEY REVIEW REQUIRED");
        } else {
          expect(clause.text).toBe("");
          expect(clause.sourceUrl).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it("records every statutory formatting requirement it cannot render", () => {
    // FL §713.015(1): 12-point, capitalised, boldface, front page or a separate
    // page signed and dated by the owner. Nothing downstream can do that yet,
    // so the requirement lives in the clause rather than being dropped.
    const fl = getStateRules("FL");
    const lien = fl.requiredClauses.find((c) => c.id === "lien-law-notice");
    expect(lien?.formatting?.minPointSize).toBe(12);
    expect(lien?.formatting?.boldface).toBe(true);
    expect(lien?.formatting?.capitalized).toBe(true);
    expect(lien?.formatting?.ownerSignatureAndDateRequired).toBe(true);
    expect(lien?.formatting?.placement).toBeTruthy();

    // TX §601.053: 10-point boldface, in duplicate, easily detachable.
    const tx = getStateRules("TX");
    const cancel = tx.requiredClauses.find((c) => c.id === "notice-of-cancellation-form");
    expect(cancel?.formatting?.minPointSize).toBe(10);
    expect(cancel?.formatting?.boldface).toBe(true);
    expect(cancel?.formatting?.copies).toBe(2);
    expect(cancel?.formatting?.easilyDetachable).toBe(true);

    // NY §771(1)(d): "clear and conspicuous bold face type", no point size given.
    const ny = getStateRules("NY");
    const lienNotice = ny.requiredClauses.find((c) => c.id === "mechanics-lien-notice");
    expect(lienNotice?.formatting?.boldface).toBe(true);
  });
});

describe("contracts: licence display is jurisdiction-scoped", () => {
  /*
   * CHANGED EXPECTATION. ny.json encoded `licenseDisplayRequired: true`
   * statewide. GBL §771(1)(a) requires the licence number "if applicable", and
   * New York has no universal state contractor licence — licensing is county or
   * municipal. Shipping `true` told every upstate contractor to print a licence
   * number that does not exist. Source: VERIFICATION-STATUS.md, NY table,
   * `licenseDisplayRequired` row.
   */

  it("New York has no statewide display duty", () => {
    const ny = getStateRules("NY");
    expect(ny.licenseDisplay.statewide).toBe(false);
    expect(ny.licenseDisplay.statute).toContain("771(1)(a)");
    expect(ny.licenseDisplay.note).toBeTruthy();
  });

  it("does not assert an uncited local regime", () => {
    // NYC and several surrounding counties run their own licensing, but none of
    // it has been verified against a primary source, so none of it is encoded.
    expect(getStateRules("NY").licenseDisplay.jurisdictions).toEqual([]);
  });

  it("states with a positive statewide cite keep it", () => {
    expect(getStateRules("CA").licenseDisplay.statewide).toBe(true);
    expect(getStateRules("CA").licenseDisplay.statute).toContain("7030.5");
    expect(getStateRules("FL").licenseDisplay.statewide).toBe(true);
    // PA's registration number is required IN THE CONTRACT by §517.7(a)(1) —
    // not by §517.9, which is the prohibited-acts section and imposes no
    // display duty at all.
    expect(getStateRules("PA").licenseDisplay.statewide).toBe(true);
    expect(getStateRules("PA").licenseDisplay.statute).toContain("517.7(a)(1)");
    expect(getStateRules("TX").licenseDisplay.statewide).toBe(false);
  });

  it("every jurisdiction entry carries its own citation", () => {
    for (const stateId of STATE_IDS) {
      for (const j of getStateRules(stateId).licenseDisplay.jurisdictions) {
        expect(j.citation.url).toMatch(/^https:\/\//);
        expect(j.citation.lastVerified.length).toBeGreaterThan(0);
      }
    }
  });
});
