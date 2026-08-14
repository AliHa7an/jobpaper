/**
 * Rules loader. JSON imports are structurally typed by TypeScript with
 * widened string types, so each file passes a light runtime shape check
 * before being narrowed to its rule type. Fail loudly on malformed rules —
 * never guess.
 */

import type { StateId, StateRules, TradeId, TradeRules } from "../types";

import bathroomRemodel from "./trades/bathroom-remodel.json";
import decks from "./trades/decks.json";
import interiorPaint from "./trades/interior-paint.json";

import ca from "./states/ca.json";
import fl from "./states/fl.json";
import ny from "./states/ny.json";
import pa from "./states/pa.json";
import tx from "./states/tx.json";

function asTradeRules(raw: unknown): TradeRules {
  const r = raw as TradeRules;
  if (
    typeof r.tradeId !== "string" ||
    typeof r.ruleSetVersion !== "string" ||
    !Array.isArray(r.citations) ||
    r.citations.length === 0 ||
    !Array.isArray(r.jobTypes) ||
    typeof r.laborRateCentsPerHour !== "number" ||
    !Number.isInteger(r.laborRateCentsPerHour)
  ) {
    throw new Error("Malformed trade rules file");
  }
  return r;
}

function asStateRules(raw: unknown): StateRules {
  const r = raw as StateRules;
  if (
    typeof r.stateId !== "string" ||
    typeof r.ruleSetVersion !== "string" ||
    !Array.isArray(r.citations) ||
    r.citations.length === 0 ||
    !Array.isArray(r.requiredClauses) ||
    !Number.isInteger(r.homeImprovementThresholdCents)
  ) {
    throw new Error("Malformed state rules file");
  }
  return r;
}

export const TRADE_RULES: Record<TradeId, TradeRules> = {
  decks: asTradeRules(decks),
  "interior-paint": asTradeRules(interiorPaint),
  "bathroom-remodel": asTradeRules(bathroomRemodel),
};

export const STATE_RULES: Record<StateId, StateRules> = {
  CA: asStateRules(ca),
  TX: asStateRules(tx),
  FL: asStateRules(fl),
  NY: asStateRules(ny),
  PA: asStateRules(pa),
};

export const TRADE_IDS = Object.keys(TRADE_RULES) as TradeId[];
export const STATE_IDS = Object.keys(STATE_RULES) as StateId[];

export function getTradeRules(trade: TradeId): TradeRules {
  const rules = TRADE_RULES[trade];
  if (!rules) throw new Error(`No rules for trade "${trade}"`);
  return rules;
}

export function getStateRules(state: StateId): StateRules {
  const rules = STATE_RULES[state];
  if (!rules) throw new Error(`No rules for state "${state}"`);
  return rules;
}
