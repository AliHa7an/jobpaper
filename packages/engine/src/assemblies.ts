/**
 * Assembly decomposition: a job ("deck, 12x16, mid-grade, southeast")
 * decomposes into priced line items (footings, framing, decking, railing,
 * stairs...) using the trade's versioned rules JSON. Fully deterministic.
 */

import { mulQtyCents, roundHalfAwayFromZero, roundHours } from "./money";
import { applyRegional } from "./regional";
import type {
  AssemblyRule,
  Dimensions,
  Job,
  JobTypeRule,
  LineItem,
  QtyFormula,
  TradeRules,
} from "./types";

export interface Measures {
  area: number;
  perimeter: number;
}

/** Derive area/perimeter from the job type's declared dimension mapping. */
export function deriveMeasures(jobType: JobTypeRule, dims: Dimensions): Measures {
  if (jobType.areaFrom.kind === "lengthWidth") {
    const length = dims[jobType.areaFrom.lengthField] ?? 0;
    const width = dims[jobType.areaFrom.widthField] ?? 0;
    return { area: length * width, perimeter: 2 * (length + width) };
  }
  const area = dims[jobType.areaFrom.field] ?? 0;
  // Perimeter of an unknown shape: approximate as a square of the same area.
  return { area, perimeter: 4 * Math.sqrt(Math.max(area, 0)) };
}

export function evaluateQty(formula: QtyFormula, measures: Measures, dims: Dimensions): number {
  switch (formula.kind) {
    case "fixed":
      return formula.value;
    case "measure":
      return measures[formula.measure] * formula.factor;
    case "perMeasure": {
      const raw = Math.ceil(measures[formula.measure] / formula.divisor);
      return Math.max(raw, formula.min ?? 0);
    }
    case "field":
      return (dims[formula.field] ?? 0) * formula.factor;
    case "perField": {
      const raw = Math.ceil((dims[formula.field] ?? 0) / formula.divisor);
      return Math.max(raw, formula.min ?? 0);
    }
  }
}

export function findJobType(rules: TradeRules, jobTypeId: string): JobTypeRule {
  const jt = rules.jobTypes.find((j) => j.id === jobTypeId);
  if (!jt) throw new Error(`Unknown job type "${jobTypeId}" for trade "${rules.tradeId}"`);
  return jt;
}

/**
 * Decompose a job into region- and grade-adjusted line items.
 *
 * Quantity: formula result x (1 + waste), rounded to 2 decimals.
 * Material unit cost: grade tier cost x regional multiplier (integer cents).
 * Labor: qty (pre-waste — waste is material, not labor) x hoursPerUnit
 *        x access multiplier, rounded to 2 decimals; priced at the
 *        region-adjusted labor rate.
 */
export function decomposeJob(rules: TradeRules, job: Job): LineItem[] {
  const jobType = findJobType(rules, job.jobType);
  const dims = job.inputs.dimensions;
  const measures = deriveMeasures(jobType, dims);
  const region = job.inputs.region;
  const laborRateCents = applyRegional(rules.laborRateCentsPerHour, rules, region);
  const accessBps = rules.accessLaborMultipliersBps[job.inputs.access];

  const items: LineItem[] = [];
  for (const assembly of jobType.assemblies) {
    if (assembly.appliesWhenFieldPositive !== undefined) {
      const gate = dims[assembly.appliesWhenFieldPositive] ?? 0;
      if (gate <= 0) continue;
    }
    const baseQty = evaluateQty(assembly.qty, measures, dims);
    if (baseQty <= 0) continue;

    const qtyWithWaste =
      roundHalfAwayFromZero(baseQty * (10000 + assembly.wasteFactorBps)) / 10000;
    const qty = roundHalfAwayFromZero(qtyWithWaste * 100) / 100;

    const gradeCost = assembly.materialUnitCostCents[job.inputs.grade];
    const unitCostCents = applyRegional(gradeCost, rules, region);

    const laborHours = roundHours(
      (baseQty * assembly.laborHoursPerUnit * accessBps) / 10000,
    );

    items.push({
      id: `${jobType.id}-${assembly.id}`,
      assemblyId: assembly.id,
      description: assembly.label,
      qty,
      unit: assembly.unit,
      unitCostCents,
      laborHours,
      laborRateCents,
      basis: assembly.materialBasis,
      assumptions: assembly.assumptions,
    });
  }
  return items;
}

/** Material + labor for one line, integer cents. */
export function lineTotalCents(item: LineItem): number {
  const material = mulQtyCents(item.qty, item.unitCostCents);
  const labor = mulQtyCents(item.laborHours, item.laborRateCents);
  return material + labor;
}

export function lineMaterialCents(item: LineItem): number {
  return mulQtyCents(item.qty, item.unitCostCents);
}

export function lineLaborCents(item: LineItem): number {
  return mulQtyCents(item.laborHours, item.laborRateCents);
}
