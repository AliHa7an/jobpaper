/**
 * Regional multipliers. Applied to material unit costs and labor rates
 * BEFORE line items are priced, so every unit cost the user sees is
 * already region-adjusted.
 */

import { scaleByBps } from "./money";
import type { Bps, Cents, RegionId, TradeRules } from "./types";

export function regionalMultiplierBps(rules: TradeRules, region: RegionId): Bps {
  const bps = rules.regionalMultipliersBps[region];
  if (bps === undefined) {
    throw new Error(`No regional multiplier for region "${region}" in ${rules.tradeId}`);
  }
  return bps;
}

export function applyRegional(cents: Cents, rules: TradeRules, region: RegionId): Cents {
  return scaleByBps(cents, regionalMultiplierBps(rules, region));
}

export const REGION_LABELS: Record<RegionId, string> = {
  northeast: "Northeast",
  southeast: "Southeast",
  midwest: "Midwest",
  "south-central": "South Central",
  "mountain-west": "Mountain West",
  pacific: "Pacific",
};
