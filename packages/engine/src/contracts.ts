/**
 * Deterministic contract clause selection.
 *
 * Clauses live in versioned state rules JSON (rules/states/*.json) with a
 * small trigger expression per clause. This module parses and evaluates
 * those triggers against the job facts. No AI, no heuristics — a clause is
 * either triggered by the facts or it is not.
 *
 * Trigger grammar (everything else throws — fail loudly, never guess):
 *   "always"
 *   "downpayment > 0"
 *   "downpayment > min($1000, 10%)"     10% = of contract total
 *   "downpayment > N%"                  of contract total
 *   "total > $N"  |  "total >= $N"
 *   "total >= threshold"                the state's homeImprovementThresholdCents
 */

import { formatCents, roundHalfAwayFromZero } from "./money";
import type {
  Cents,
  ContractFacts,
  ContractSelection,
  SelectedClause,
  StateRules,
} from "./types";

function dollarsToCents(dollars: string): Cents {
  // "1000" or "1,000" or "1000.50"
  const n = Number(dollars.replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new Error(`Bad dollar amount in trigger: ${dollars}`);
  return roundHalfAwayFromZero(n * 100);
}

function pctOf(totalCents: Cents, pct: number): Cents {
  return roundHalfAwayFromZero((totalCents * pct) / 100);
}

export interface TriggerResult {
  triggered: boolean;
  reason: string;
}

export function evaluateTrigger(
  trigger: string,
  facts: ContractFacts,
  thresholdCents: Cents,
): TriggerResult {
  const t = trigger.trim();

  if (t === "always") {
    return { triggered: true, reason: "Required in every home-improvement contract." };
  }

  if (t === "downpayment > 0") {
    return {
      triggered: facts.downPaymentCents > 0,
      reason: `Down payment of ${formatCents(facts.downPaymentCents)} requested.`,
    };
  }

  // downpayment > min($1000, 10%)
  const minMatch = t.match(
    /^downpayment > min\(\$([\d,.]+),\s*([\d.]+)%\)$/,
  );
  if (minMatch !== null) {
    const flat = dollarsToCents(minMatch[1] ?? "");
    const pct = Number(minMatch[2]);
    const cap = Math.min(flat, pctOf(facts.totalCents, pct));
    return {
      triggered: facts.downPaymentCents > cap,
      reason: `Down payment ${formatCents(facts.downPaymentCents)} exceeds the cap of ${formatCents(cap)} (lesser of ${formatCents(flat)} and ${pct}% of the ${formatCents(facts.totalCents)} total).`,
    };
  }

  // downpayment > N%
  const pctMatch = t.match(/^downpayment > ([\d.]+)%$/);
  if (pctMatch !== null) {
    const pct = Number(pctMatch[1]);
    const cap = pctOf(facts.totalCents, pct);
    return {
      triggered: facts.downPaymentCents > cap,
      reason: `Down payment ${formatCents(facts.downPaymentCents)} exceeds ${pct}% of the contract total (${formatCents(cap)}).`,
    };
  }

  // total > $N  |  total >= $N
  const totalMatch = t.match(/^total (>=?) \$([\d,.]+)$/);
  if (totalMatch !== null) {
    const op = totalMatch[1];
    const limit = dollarsToCents(totalMatch[2] ?? "");
    const triggered =
      op === ">=" ? facts.totalCents >= limit : facts.totalCents > limit;
    return {
      triggered,
      reason: `Contract total ${formatCents(facts.totalCents)} is ${op === ">=" ? "at or above" : "above"} ${formatCents(limit)}.`,
    };
  }

  if (t === "total >= threshold") {
    return {
      triggered: facts.totalCents >= thresholdCents,
      reason: `Contract total ${formatCents(facts.totalCents)} meets the state home-improvement threshold of ${formatCents(thresholdCents)}.`,
    };
  }

  throw new Error(`Unsupported clause trigger: "${trigger}"`);
}

/** Select the clauses this state requires for these job facts. Deterministic. */
export function selectClauses(rules: StateRules, facts: ContractFacts): ContractSelection {
  const clauses: SelectedClause[] = [];
  for (const clause of rules.requiredClauses) {
    const result = evaluateTrigger(clause.trigger, facts, rules.homeImprovementThresholdCents);
    if (result.triggered) {
      clauses.push({ ...clause, reason: result.reason });
    }
  }
  return {
    stateId: rules.stateId,
    clauses,
    licenseDisplayRequired: rules.licenseDisplayRequired,
    prohibitedTerms: rules.prohibitedTerms,
    overThreshold: facts.totalCents >= rules.homeImprovementThresholdCents,
    homeImprovementThresholdCents: rules.homeImprovementThresholdCents,
    ruleSetVersion: rules.ruleSetVersion,
    citations: rules.citations,
  };
}
