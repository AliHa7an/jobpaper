/**
 * JobPaper engine — core types.
 *
 * INVARIANTS (see the portfolio invariants doc):
 * - Money is ALWAYS integer cents (`Cents`). Never floats for currency.
 * - Percentages travel as basis points (10% -> 1000 bps).
 * - This package has zero dependencies, zero AI, zero network access.
 */

/** Integer cents. 1 dollar = 100. Never fractional. */
export type Cents = number;

/** Basis points. 1% = 100 bps, 100% = 10000 bps. Always integer. */
export type Bps = number;

export type TradeId = "decks" | "interior-paint" | "bathroom-remodel";

export type RegionId =
  | "northeast"
  | "southeast"
  | "midwest"
  | "south-central"
  | "mountain-west"
  | "pacific";

export type MaterialGrade = "economy" | "mid" | "premium";

export type AccessLevel = "easy" | "standard" | "difficult";

export type StateId = "CA" | "TX" | "FL" | "NY" | "PA";

/** Free-form dimension inputs keyed by the trade rules' dimension field ids. */
export type Dimensions = Record<string, number>;

export interface JobInputs {
  dimensions: Dimensions;
  grade: MaterialGrade;
  access: AccessLevel;
  region: RegionId;
}

export interface Job {
  trade: TradeId;
  jobType: string;
  inputs: JobInputs;
}

/** One row on the takeoff sheet. All money integer cents. */
export interface LineItem {
  id: string;
  assemblyId: string;
  description: string;
  qty: number;
  unit: string;
  /** Region-adjusted material cost per unit. */
  unitCostCents: Cents;
  /** Estimated labor hours for the whole line (2-decimal precision). */
  laborHours: number;
  /** Region-adjusted labor rate per hour. */
  laborRateCents: Cents;
  /** Where the numbers come from — shown to the user, always. */
  basis: string;
  /** Pinned assumption notes rendered on the takeoff sheet. */
  assumptions: string[];
}

export interface EstimateTotals {
  materialsCents: Cents;
  laborCents: Cents;
  subtotalCents: Cents;
  overheadCents: Cents;
  profitCents: Cents;
  totalCents: Cents;
}

/** Estimates are ranges, not points. */
export interface EstimateRange {
  lowCents: Cents;
  highCents: Cents;
}

export interface Estimate {
  job: Job;
  lineItems: LineItem[];
  /** User-set overhead, basis points (taught default from trade rules). */
  overheadBps: Bps;
  /** User-set profit, basis points (taught default from trade rules). */
  profitBps: Bps;
  totals: EstimateTotals;
  range: EstimateRange;
  regionalMultiplierBps: Bps;
  ruleSetVersion: string;
  rulesLastVerified: string;
  /** True when the pricing rules behind this estimate are past their stale window. */
  staleRules: boolean;
  generatedAt: string;
}

export interface InvoiceLine {
  description: string;
  qty: number;
  unit: string;
  amountCents: Cents;
}

export interface Invoice {
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  lines: InvoiceLine[];
  subtotalCents: Cents;
  overheadProfitCents: Cents;
  totalCents: Cents;
  depositCents: Cents;
  balanceDueCents: Cents;
  /** Must equal the source estimate's totals.totalCents. */
  sourceEstimateTotalCents: Cents;
  ruleSetVersion: string;
}

/** Facts the contract clause triggers evaluate against. */
export interface ContractFacts {
  totalCents: Cents;
  downPaymentCents: Cents;
}

export interface Citation {
  label: string;
  url: string;
  lastVerified: string;
}

export interface ClauseRule {
  id: string;
  title: string;
  text: string;
  /** Deterministic trigger expression, e.g. "always", "downpayment > min($1000, 10%)". */
  trigger: string;
  statute: string;
}

export interface SelectedClause extends ClauseRule {
  /** Plain-English reason this clause was included. */
  reason: string;
}

export interface ContractSelection {
  stateId: StateId;
  clauses: SelectedClause[];
  licenseDisplayRequired: boolean;
  prohibitedTerms: string[];
  /** True when job total meets/exceeds the state's home-improvement threshold. */
  overThreshold: boolean;
  homeImprovementThresholdCents: Cents;
  ruleSetVersion: string;
  citations: Citation[];
}

// ---------------------------------------------------------------------------
// Rules-file shapes (versioned, cited JSON — see rules/ directory)
// ---------------------------------------------------------------------------

/** Deterministic quantity formula DSL interpreted by assemblies.ts. */
export type QtyFormula =
  | { kind: "fixed"; value: number }
  | { kind: "measure"; measure: "area" | "perimeter"; factor: number }
  | {
      kind: "perMeasure";
      measure: "area" | "perimeter";
      divisor: number;
      roundUp: true;
      min?: number;
    }
  | { kind: "field"; field: string; factor: number }
  | { kind: "perField"; field: string; divisor: number; roundUp: true; min?: number };

export interface AssemblyRule {
  id: string;
  label: string;
  unit: string;
  qty: QtyFormula;
  /** Waste applied to material quantity, bps (1000 = +10%). */
  wasteFactorBps: Bps;
  /** Material unit cost per grade tier, cents. */
  materialUnitCostCents: Record<MaterialGrade, Cents>;
  materialBasis: string;
  laborHoursPerUnit: number;
  assumptions: string[];
  /** Include this assembly only when the named dimension field is > 0. */
  appliesWhenFieldPositive?: string;
}

export interface DimensionFieldRule {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  default: number;
}

export interface JobTypeRule {
  id: string;
  label: string;
  dimensionFields: DimensionFieldRule[];
  /** Fields used to derive area: [length, width] pair or a single direct-area field. */
  areaFrom: { kind: "lengthWidth"; lengthField: string; widthField: string } | {
    kind: "direct";
    field: string;
  };
  assemblies: AssemblyRule[];
}

export interface TradeRules {
  tradeId: TradeId;
  label: string;
  ruleSetVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  dataBasis: string;
  citations: Citation[];
  /** Rules older than this (days since lastVerified) flag estimates as stale. */
  staleAfterDays: number;
  laborRateCentsPerHour: Cents;
  laborRateBasis: string;
  accessLaborMultipliersBps: Record<AccessLevel, Bps>;
  regionalMultipliersBps: Record<RegionId, Bps>;
  /** Estimate range spread around the computed total. */
  rangeBps: { low: Bps; high: Bps };
  taughtDefaults: { overheadBps: Bps; profitBps: Bps };
  jobTypes: JobTypeRule[];
}

export interface StateRules {
  stateId: StateId;
  stateName: string;
  ruleSetVersion: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  citations: Citation[];
  homeImprovementThresholdCents: Cents;
  requiredClauses: ClauseRule[];
  licenseDisplayRequired: boolean;
  prohibitedTerms: string[];
}
