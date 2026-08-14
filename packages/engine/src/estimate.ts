/**
 * Estimate assembly: line items + overhead% + profit%, output as a range.
 *
 * Total structure (documented order of operations):
 *   materials = sum of round(qty x region-adjusted unit cost)
 *   labor     = sum of round(hours x region-adjusted rate)
 *   subtotal  = materials + labor
 *   overhead  = subtotal x overheadBps          (covers truck, insurance, tools)
 *   profit    = (subtotal + overhead) x profitBps
 *   total     = subtotal + overhead + profit
 *   range     = [total x rangeBps.low, total x rangeBps.high]
 *
 * Overhead and profit are user-set; the trade rules carry taught defaults.
 */

import {
  decomposeJob,
  lineLaborCents,
  lineMaterialCents,
} from "./assemblies";
import { addCents, applyBps, assertBps, scaleByBps } from "./money";
import { regionalMultiplierBps } from "./regional";
import type {
  Estimate,
  EstimateTotals,
  Job,
  LineItem,
  TradeRules,
} from "./types";

export interface EstimateOptions {
  overheadBps?: number;
  profitBps?: number;
  /** "Now" for stale-rule detection; injectable for tests. ISO date string. */
  asOf?: string;
}

const MS_PER_DAY = 86_400_000;

/** Latest lastVerified across the rules' citations; used for staleness. */
export function rulesLastVerified(rules: TradeRules): string {
  let latest = "";
  for (const c of rules.citations) {
    if (c.lastVerified > latest) latest = c.lastVerified;
  }
  return latest;
}

export function rulesAreStale(rules: TradeRules, asOfIso: string): boolean {
  const verified = rulesLastVerified(rules);
  if (!verified) return true;
  const ageMs = Date.parse(asOfIso) - Date.parse(verified);
  return ageMs > rules.staleAfterDays * MS_PER_DAY;
}

export function computeTotals(
  lineItems: LineItem[],
  overheadBps: number,
  profitBps: number,
): EstimateTotals {
  assertBps(overheadBps, "overheadBps");
  assertBps(profitBps, "profitBps");
  const materialsCents = addCents(0, ...lineItems.map(lineMaterialCents));
  const laborCents = addCents(0, ...lineItems.map(lineLaborCents));
  const subtotalCents = materialsCents + laborCents;
  const overheadCents = applyBps(subtotalCents, overheadBps);
  const profitCents = applyBps(subtotalCents + overheadCents, profitBps);
  const totalCents = subtotalCents + overheadCents + profitCents;
  return { materialsCents, laborCents, subtotalCents, overheadCents, profitCents, totalCents };
}

/** Build a full estimate from a job against a trade's rules. Pure. */
export function buildEstimate(
  rules: TradeRules,
  job: Job,
  options: EstimateOptions = {},
): Estimate {
  if (job.trade !== rules.tradeId) {
    throw new Error(`Job trade "${job.trade}" does not match rules "${rules.tradeId}"`);
  }
  const overheadBps = options.overheadBps ?? rules.taughtDefaults.overheadBps;
  const profitBps = options.profitBps ?? rules.taughtDefaults.profitBps;
  const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);

  const lineItems = decomposeJob(rules, job);
  const totals = computeTotals(lineItems, overheadBps, profitBps);

  return {
    job,
    lineItems,
    overheadBps,
    profitBps,
    totals,
    range: {
      lowCents: scaleByBps(totals.totalCents, rules.rangeBps.low),
      highCents: scaleByBps(totals.totalCents, rules.rangeBps.high),
    },
    regionalMultiplierBps: regionalMultiplierBps(rules, job.inputs.region),
    ruleSetVersion: rules.ruleSetVersion,
    rulesLastVerified: rulesLastVerified(rules),
    staleRules: rulesAreStale(rules, asOf),
    generatedAt: asOf,
  };
}

/** Recompute totals + range after the user edits line items in place. */
export function recomputeEstimate(rules: TradeRules, estimate: Estimate): Estimate {
  const totals = computeTotals(estimate.lineItems, estimate.overheadBps, estimate.profitBps);
  return {
    ...estimate,
    totals,
    range: {
      lowCents: scaleByBps(totals.totalCents, rules.rangeBps.low),
      highCents: scaleByBps(totals.totalCents, rules.rangeBps.high),
    },
  };
}
