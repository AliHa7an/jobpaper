/**
 * Integer-cent arithmetic. The only place rounding happens.
 *
 * ROUNDING RULES (documented here, nowhere else):
 * 1. All money values are integer cents. `assertCents` guards every boundary.
 * 2. Any operation that can produce a fraction (qty x unit cost, bps
 *    application, hourly labor) rounds HALF AWAY FROM ZERO to the nearest
 *    cent at the point the value becomes money — never earlier, never twice.
 * 3. Basis points: applyBps(cents, 1000) = +10%, computed as
 *    round(cents * bps / 10000).
 * 4. Quantities may be fractional (e.g. 192 sq ft x 1.1 waste); labor hours
 *    are rounded to 2 decimals BEFORE being priced so the hours a user sees
 *    are exactly the hours that were billed.
 */

import type { Bps, Cents } from "./types";

/** Round half away from zero. round(2.5)=3, round(-2.5)=-3. */
export function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

export function assertCents(value: number, label = "amount"): Cents {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${label} must be integer cents, got ${value}`);
  }
  return value;
}

export function assertBps(value: number, label = "rate"): Bps {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${label} must be integer basis points, got ${value}`);
  }
  return value;
}

export function addCents(...values: Cents[]): Cents {
  let sum = 0;
  for (const v of values) sum += assertCents(v);
  return sum;
}

/** qty (possibly fractional) x integer unit cost -> integer cents. */
export function mulQtyCents(qty: number, unitCostCents: Cents): Cents {
  assertCents(unitCostCents, "unitCostCents");
  if (!Number.isFinite(qty)) throw new Error(`qty must be finite, got ${qty}`);
  return roundHalfAwayFromZero(qty * unitCostCents);
}

/** Apply basis points: applyBps(10000, 1500) = 1500 (i.e. 15% of $100). */
export function applyBps(cents: Cents, bps: Bps): Cents {
  assertCents(cents);
  assertBps(bps);
  return roundHalfAwayFromZero((cents * bps) / 10000);
}

/** Scale a money value by a multiplier expressed in bps (10000 = x1). */
export function scaleByBps(cents: Cents, multiplierBps: Bps): Cents {
  assertCents(cents);
  assertBps(multiplierBps, "multiplierBps");
  return roundHalfAwayFromZero((cents * multiplierBps) / 10000);
}

/** Round a fractional hours figure to 2 decimals (display + billing precision). */
export function roundHours(hours: number): number {
  return roundHalfAwayFromZero(hours * 100) / 100;
}

/** "$1,234.56" — for the engine's own deterministic strings only. */
export function formatCents(cents: Cents): string {
  assertCents(cents);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = String(abs % 100).padStart(2, "0");
  const withCommas = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${withCommas}.${rem}`;
}

/** "$8,400" — whole-dollar display for ranges. Rounds to nearest dollar. */
export function formatCentsWholeDollars(cents: Cents): string {
  assertCents(cents);
  const sign = cents < 0 ? "-" : "";
  const dollars = Math.abs(roundHalfAwayFromZero(cents / 100));
  const withCommas = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${withCommas}`;
}
