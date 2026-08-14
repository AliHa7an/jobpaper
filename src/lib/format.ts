import type { Cents } from "@engine";

/**
 * Formatting helpers — the single source of truth for how a number reaches a
 * user's eye. Design contract §"Formatting helpers".
 *
 * Two rules bind everything here:
 *   1. Currency NEVER abbreviates. "$1,204,000", never "$1.2M" — in a results
 *      table an approximation reads as imprecision.
 *   2. Negatives carry a MINUS SIGN (U+2212, the typographic minus, which is
 *      the same width as a digit in a tabular face), never parentheses.
 *
 * Every string produced here is meant to be rendered inside `.num`.
 */

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** U+2212 MINUS SIGN — tabular-width, unlike the hyphen-minus. */
const MINUS = "−";

/** $1,234 (whole dollars, rounded half away from zero). */
export function usd(cents: Cents): string {
  const dollars = Math.round(Math.abs(cents) / 100);
  return `${cents < 0 ? MINUS : ""}$${dollars.toLocaleString("en-US")}`;
}

/** $1,234.56 (exact cents). */
export function usdExact(cents: Cents): string {
  const sign = cents < 0 ? MINUS : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = (abs % 100).toString().padStart(2, "0");
  return `${sign}$${dollars}.${rem}`;
}

/**
 * "$1,204" — cents shown only when they are non-zero, so whole-dollar columns
 * stay clean and a $1,204.37 figure is never silently rounded away.
 */
export function formatCents(cents: Cents): string {
  return cents % 100 === 0 ? usd(cents) : usdExact(cents);
}

/** "$1,204.37" — always two decimal places. For traces and audit rows. */
export function formatCentsExact(cents: Cents): string {
  return usdExact(cents);
}

/**
 * "8 Aug 2026" — never 08/08/2026, which is ambiguous internationally and
 * reads as a form field rather than a fact.
 *
 * Parsed from the ISO string's own characters, never through `new Date()`,
 * so a date can't shift a day by crossing a timezone boundary.
 * Accepts "2026-08-08" and "2026-08"; returns the input unchanged if it is
 * not a date we recognise, so a bad value is visible rather than invented.
 */
export function formatDate(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const name = MONTH_NAMES[month - 1];
  if (!name || !Number.isFinite(year) || year === 0) return iso;

  const day = Number(iso.slice(8, 10));
  if (!Number.isFinite(day) || day === 0) return `${name} ${year}`;
  return `${day} ${name} ${year}`;
}

/**
 * "5.0%" — one decimal, maximum. Takes a percentage, not a fraction:
 * `formatPct(5)` is "5.0%". Basis points convert with `bps / 100`.
 */
export function formatPct(pct: number): string {
  const rounded = Math.abs(pct).toFixed(1);
  return `${pct < 0 ? MINUS : ""}${rounded}%`;
}

/** "12 yrs 4 mos" from a month count. Singulars stay singular. */
export function formatMonths(months: number): string {
  const total = Math.max(0, Math.round(months));
  const yr = Math.floor(total / 12);
  const mo = total % 12;
  const yrLabel = `${yr} ${yr === 1 ? "yr" : "yrs"}`;
  const moLabel = `${mo} ${mo === 1 ? "mo" : "mos"}`;
  if (yr === 0) return moLabel;
  if (mo === 0) return yrLabel;
  return `${yrLabel} ${moLabel}`;
}

/** "12 yr 4 mo" — the compact variant used inside table cells. */
export function durationLabel(months: number): string {
  const yr = Math.floor(months / 12);
  const mo = months % 12;
  if (yr === 0) return `${mo} mo`;
  if (mo === 0) return `${yr} yr`;
  return `${yr} yr ${mo} mo`;
}

/** "Aug 2056" from an ISO date. */
export function monthLabel(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  return `${MONTH_NAMES[month - 1] ?? ""} ${year}`;
}
