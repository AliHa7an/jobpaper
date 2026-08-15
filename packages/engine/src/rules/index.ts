/**
 * Rules loader. JSON imports are structurally typed by TypeScript with
 * widened string types, so each file passes a light runtime shape check
 * before being narrowed to its rule type. Fail loudly on malformed rules —
 * never guess.
 */

import type { ClauseTextStatus, StateId, StateRules, TradeId, TradeRules } from "../types";

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

const CLAUSE_TEXT_STATUSES: readonly ClauseTextStatus[] = [
  "DRAFTED",
  "VERBATIM_REQUIRED_NOT_TRANSCRIBED",
  "SUBSTANTIALLY_SIMILAR_REQUIRED_NOT_TRANSCRIBED",
];

function asStateRules(raw: unknown): StateRules {
  const r = raw as StateRules;
  if (
    typeof r.stateId !== "string" ||
    typeof r.ruleSetVersion !== "string" ||
    !Array.isArray(r.citations) ||
    r.citations.length === 0 ||
    !Array.isArray(r.requiredClauses) ||
    !Number.isInteger(r.homeImprovementThresholdCents) ||
    typeof r.licenseDisplay !== "object" ||
    r.licenseDisplay === null ||
    typeof r.licenseDisplay.statewide !== "boolean" ||
    !Array.isArray(r.licenseDisplay.jurisdictions)
  ) {
    throw new Error("Malformed state rules file");
  }

  // Every clause declares whether its wording may be drafted or must be
  // transcribed from the statute. A clause with no declared status would be
  // treated as drafted by default, and defaulting to "safe to print" is exactly
  // the failure this field exists to prevent.
  for (const clause of r.requiredClauses) {
    if (!CLAUSE_TEXT_STATUSES.includes(clause.textStatus)) {
      throw new Error(
        `Clause "${clause.id}" in ${r.stateId} has no valid textStatus (got ${String(clause.textStatus)})`,
      );
    }
    if (clause.textStatus === "DRAFTED") continue;
    if (typeof clause.sourceUrl !== "string" || clause.sourceUrl.length === 0) {
      throw new Error(
        `Clause "${clause.id}" in ${r.stateId} is ${clause.textStatus} but carries no sourceUrl to transcribe from`,
      );
    }
    if (clause.text.length > 0) {
      throw new Error(
        `Clause "${clause.id}" in ${r.stateId} is ${clause.textStatus} but carries text. Untranscribed prescribed wording must be empty — a paraphrase in this field would be rendered into a contract.`,
      );
    }
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
