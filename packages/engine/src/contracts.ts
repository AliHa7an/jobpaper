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
 *   "downpayment > 1/3"                 exact thirds, integer arithmetic
 *   "downpayment > 1/3 + specialOrderMaterials"
 *   "total > $N"  |  "total >= $N"
 *   "total >= threshold"                the state's homeImprovementThresholdCents
 *   "<expr> and <expr>"                 conjunction of any two of the above
 *
 * Contracts also FAIL CLOSED. Where a statute prescribes notice wording and that
 * wording has not been transcribed from the statute, no contract is produced for
 * that state at all — see `assertContractGeneratable` below.
 */

import { formatCents, roundHalfAwayFromZero } from "./money";
import type {
  Cents,
  ClauseRule,
  ClauseTextStatus,
  ContractFacts,
  ContractSelection,
  SelectedClause,
  StateId,
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

  // Conjunction. Split on the FIRST " and " and recurse, so a rule with a
  // dollar gate and a proportional cap ("total > $5,000 and downpayment > 1/3")
  // stays one expression instead of becoming a special case per state.
  const andAt = t.indexOf(" and ");
  if (andAt !== -1) {
    const left = evaluateTrigger(t.slice(0, andAt), facts, thresholdCents);
    const right = evaluateTrigger(t.slice(andAt + 5), facts, thresholdCents);
    return {
      triggered: left.triggered && right.triggered,
      reason: `${left.reason} ${right.reason}`,
    };
  }

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

  // downpayment > 1/3   |   downpayment > 1/3 + specialOrderMaterials
  //
  // Exact thirds, never a basis-point approximation: "one-third" is not 33%,
  // and on a $9,000 job the difference between the two is $30 of lawful
  // deposit. Compared as `deposit * 3 > total` so no rounding enters at all.
  const thirdMatch = t.match(/^downpayment > 1\/3( \+ specialOrderMaterials)?$/);
  if (thirdMatch !== null) {
    const withMaterials = thirdMatch[1] !== undefined;
    const materials = withMaterials ? (facts.specialOrderMaterialsCents ?? 0) : 0;
    // deposit > total/3 + materials  ⇔  deposit*3 > total + materials*3
    const triggered = facts.downPaymentCents * 3 > facts.totalCents + materials * 3;
    const capCents = Math.floor(facts.totalCents / 3) + materials;
    return {
      triggered,
      reason: withMaterials
        ? `Down payment ${formatCents(facts.downPaymentCents)} exceeds one-third of the ${formatCents(facts.totalCents)} contract price plus ${formatCents(materials)} of special-order materials (about ${formatCents(capCents)}).`
        : `Down payment ${formatCents(facts.downPaymentCents)} exceeds one-third of the ${formatCents(facts.totalCents)} contract price (about ${formatCents(capCents)}).`,
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

// ---------------------------------------------------------------------------
// Fail closed on untranscribed statutory text
// ---------------------------------------------------------------------------

/** A required clause whose statutory wording has not been transcribed. */
export interface UntranscribedClause {
  clauseId: string;
  title: string;
  statute: string;
  textStatus: Exclude<ClauseTextStatus, "DRAFTED">;
  /** Primary source to transcribe the prescribed wording from. */
  sourceUrl: string;
}

function untranscribed(clause: ClauseRule): UntranscribedClause | null {
  if (clause.textStatus === "DRAFTED") return null;
  return {
    clauseId: clause.id,
    title: clause.title,
    statute: clause.statute,
    textStatus: clause.textStatus,
    // asStateRules guarantees a sourceUrl on every non-DRAFTED clause.
    sourceUrl: clause.sourceUrl ?? "",
  };
}

/**
 * Thrown instead of producing a contract that omits, paraphrases or invents
 * prescribed statutory text.
 *
 * The engine already throws on an unrecognised clause trigger rather than
 * guessing what it meant; this is the same rule applied to clause CONTENT. A
 * plausible-looking notice that does not match the statute is worse than an
 * absent one, because it gets signed.
 */
export class ContractBlockedError extends Error {
  override readonly name = "ContractBlockedError";
  readonly stateId: StateId;
  readonly stateName: string;
  readonly blockers: UntranscribedClause[];

  constructor(stateId: StateId, stateName: string, blockers: UntranscribedClause[]) {
    const lines = blockers.map(
      (b) =>
        `  - ${b.clauseId} ("${b.title}") — ${b.statute} — ${b.textStatus} — transcribe from ${b.sourceUrl}`,
    );
    super(
      `Cannot generate a ${stateName} (${stateId}) contract: ` +
        `${blockers.length} required clause${blockers.length === 1 ? " has" : "s have"} no transcribed statutory text.\n` +
        `${lines.join("\n")}\n` +
        `Prescribed notice wording must be transcribed character-for-character from the statute. ` +
        `It is never paraphrased, summarised or reconstructed from recall.`,
    );
    this.stateId = stateId;
    this.stateName = stateName;
    this.blockers = blockers;
  }
}

/**
 * Every clause in this state whose text is prescribed but not transcribed.
 * Empty means a contract can be generated. Call this before `selectClauses` to
 * render a blocked state instead of catching a throw.
 *
 * Deliberately NOT fact-scoped: a state is blocked if ANY required clause is
 * untranscribed, even one this job's facts would not trigger. A rule that only
 * blocks the jobs it happens to fire on invites the fix "make the job smaller".
 */
export function untranscribedClauses(rules: StateRules): UntranscribedClause[] {
  const out: UntranscribedClause[] = [];
  for (const clause of rules.requiredClauses) {
    const u = untranscribed(clause);
    if (u !== null) out.push(u);
  }
  return out;
}

/** True when every required clause in this state carries drafted, renderable text. */
export function canGenerateContract(rules: StateRules): boolean {
  return untranscribedClauses(rules).length === 0;
}

/** Throws `ContractBlockedError` unless every required clause is transcribed. */
export function assertContractGeneratable(rules: StateRules): void {
  const blockers = untranscribedClauses(rules);
  if (blockers.length > 0) {
    throw new ContractBlockedError(rules.stateId, rules.stateName, blockers);
  }
}

/**
 * Select the clauses this state requires for these job facts. Deterministic.
 *
 * Throws `ContractBlockedError` when the state has any required clause whose
 * prescribed wording has not been transcribed.
 */
export function selectClauses(rules: StateRules, facts: ContractFacts): ContractSelection {
  assertContractGeneratable(rules);

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
    licenseDisplay: rules.licenseDisplay,
    prohibitedTerms: rules.prohibitedTerms,
    overThreshold: facts.totalCents >= rules.homeImprovementThresholdCents,
    homeImprovementThresholdCents: rules.homeImprovementThresholdCents,
    ruleSetVersion: rules.ruleSetVersion,
    citations: rules.citations,
  };
}
