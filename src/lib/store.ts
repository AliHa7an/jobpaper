"use client";

/**
 * localStorage persistence for the current documents. v1 stores nothing
 * server-side: no database, no accounts. Persisted state is Zod-validated on
 * load — never trust what came back from storage.
 *
 * Reads go through `useSyncExternalStore`, not an effect, because that is what
 * localStorage is: an external store React has to subscribe to. The snapshot
 * functions memoise on the RAW string, so repeated snapshot reads return the
 * same object identity and React does not loop.
 *
 * The server snapshot is `undefined`, meaning "not known yet" — distinct from
 * `null`, which means "checked, and there is nothing saved". That distinction
 * is what lets the invoice and contract screens render nothing during
 * hydration instead of flashing their empty state at a user who has an
 * estimate saved.
 */

import { useSyncExternalStore } from "react";
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
  /* Optional so facts saved before PA's §517.9 cap was modelled still parse.
     Absent reads as zero, which is the strict cap — the safe direction. */
  specialOrderMaterialsCents: centsSchema.nonnegative().optional(),
});

export type StoredContractFacts = z.infer<typeof contractFactsSchema>;

/* ── plumbing ───────────────────────────────────────────────────────────── */

function subscribe(onChange: () => void): () => void {
  // "storage" fires for other tabs only, which is exactly right: this tab
  // already re-renders from its own state when it writes.
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Memoise a parse on the raw string so the snapshot is referentially stable. */
function snapshotReader<T>(key: string, parse: (raw: string) => T | null) {
  let lastRaw: string | null = null;
  let lastValue: T | null = null;
  let primed = false;

  return (): T | null => {
    const raw = window.localStorage.getItem(key);
    if (!primed || raw !== lastRaw) {
      lastRaw = raw;
      lastValue = raw === null ? null : parse(raw);
      primed = true;
    }
    return lastValue;
  };
}

const readEstimate = snapshotReader<Estimate>(ESTIMATE_KEY, (raw) => {
  try {
    const parsed = estimateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as Estimate) : null;
  } catch {
    return null;
  }
});

const readContractFacts = snapshotReader<StoredContractFacts>(
  CONTRACT_FACTS_KEY,
  (raw) => {
    try {
      const parsed = contractFactsSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  },
);

const unknownSnapshot = () => undefined;

/* ── public API ─────────────────────────────────────────────────────────── */

export function saveEstimate(estimate: Estimate): void {
  window.localStorage.setItem(ESTIMATE_KEY, JSON.stringify(estimate));
}

export function saveContractFacts(facts: StoredContractFacts): void {
  window.localStorage.setItem(CONTRACT_FACTS_KEY, JSON.stringify(facts));
}

/** `undefined` while hydrating, `null` when nothing is saved. */
export function useStoredEstimate(): Estimate | null | undefined {
  return useSyncExternalStore(subscribe, readEstimate, unknownSnapshot);
}

/** `undefined` while hydrating, `null` when nothing is saved. */
export function useStoredContractFacts(): StoredContractFacts | null | undefined {
  return useSyncExternalStore(subscribe, readContractFacts, unknownSnapshot);
}
