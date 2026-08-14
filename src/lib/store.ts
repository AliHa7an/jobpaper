/**
 * localStorage persistence for the current documents. v1 stores nothing
 * server-side: no database, no accounts. Persisted state is Zod-validated
 * on load — never trust what came back from storage.
 */

import { z } from "zod";

import type { Estimate } from "@engine";

const ESTIMATE_KEY = "jobpaper.estimate.v1";
const CONTRACT_FACTS_KEY = "jobpaper.contract-facts.v1";

const centsSchema = z.number().int();

const lineItemSchema = z.object({
  id: z.string(),
  assemblyId: z.string(),
  description: z.string(),
  qty: z.number().nonnegative(),
  unit: z.string(),
  unitCostCents: centsSchema,
  laborHours: z.number().nonnegative(),
  laborRateCents: centsSchema,
  basis: z.string(),
  assumptions: z.array(z.string()),
});

const estimateSchema = z.object({
  job: z.object({
    trade: z.enum(["decks", "interior-paint", "bathroom-remodel"]),
    jobType: z.string(),
    inputs: z.object({
      dimensions: z.record(z.string(), z.number()),
      grade: z.enum(["economy", "mid", "premium"]),
      access: z.enum(["easy", "standard", "difficult"]),
      region: z.enum([
        "northeast",
        "southeast",
        "midwest",
        "south-central",
        "mountain-west",
        "pacific",
      ]),
    }),
  }),
  lineItems: z.array(lineItemSchema),
  overheadBps: z.number().int(),
  profitBps: z.number().int(),
  totals: z.object({
    materialsCents: centsSchema,
    laborCents: centsSchema,
    subtotalCents: centsSchema,
    overheadCents: centsSchema,
    profitCents: centsSchema,
    totalCents: centsSchema,
  }),
  range: z.object({ lowCents: centsSchema, highCents: centsSchema }),
  regionalMultiplierBps: z.number().int(),
  ruleSetVersion: z.string(),
  rulesLastVerified: z.string(),
  staleRules: z.boolean(),
  generatedAt: z.string(),
});

export const contractFactsSchema = z.object({
  stateId: z.enum(["CA", "TX", "FL", "NY", "PA"]),
  downPaymentCents: centsSchema.nonnegative(),
});

export type StoredContractFacts = z.infer<typeof contractFactsSchema>;

export function saveEstimate(estimate: Estimate): void {
  window.localStorage.setItem(ESTIMATE_KEY, JSON.stringify(estimate));
}

export function loadEstimate(): Estimate | null {
  try {
    const raw = window.localStorage.getItem(ESTIMATE_KEY);
    if (raw === null) return null;
    const parsed = estimateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as Estimate) : null;
  } catch {
    return null;
  }
}

export function saveContractFacts(facts: StoredContractFacts): void {
  window.localStorage.setItem(CONTRACT_FACTS_KEY, JSON.stringify(facts));
}

export function loadContractFacts(): StoredContractFacts | null {
  try {
    const raw = window.localStorage.getItem(CONTRACT_FACTS_KEY);
    if (raw === null) return null;
    const parsed = contractFactsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
