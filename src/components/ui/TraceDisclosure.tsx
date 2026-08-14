"use client";

/**
 * M9 — traces on tap.
 *
 * Every figure in this product can show its work: the formula, the inputs
 * actually used, the rule version it was computed against, and the primary
 * source. Curiosity is engagement and this is also the trust mechanism, which
 * is the rare case where one interaction serves both.
 *
 * Expansion is 200ms, in place, never a modal — a modal would take the figure
 * away in order to explain it.
 *
 * Nothing here is computed. Every value is passed in already formatted by the
 * caller from engine output, so the trace cannot disagree with the number it
 * explains (CLAUDE.md: never state a computed figure without its "how this was
 * calculated" affordance).
 */

import { Disclosure } from "@/components/ui/Disclosure";

export interface TraceInput {
  label: string;
  /** Pre-formatted by the caller — the exact figure the engine used. */
  value: string | number;
}

export interface TraceDisclosureProps {
  /** "10% × (AGI − 150% FPL) ÷ 12", in the reader's terms. */
  formula: string;
  inputs: TraceInput[];
  /** The rule set the figure was computed against, e.g. "2026.07". */
  ruleVersion: string;
  citation: { label: string; url: string; lastVerified: string };
  /**
   * Quiet inline trigger — for traces that repeat down a list of rows.
   * The figures stay the loudest thing in the table; the affordance stays
   * present on every row.
   */
  compact?: boolean;
  /**
   * Accessible name for the trigger. In a list of rows the visible label
   * repeats, so pass something that names the row — "How the RAP figures were
   * calculated" — or a screen-reader user hears nine identical buttons.
   */
  summaryLabel?: string;
  className?: string;
}

/** "8 Aug 2026" — never 08/08/2026, which is ambiguous. */
function formatIsoDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const names = [
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
  ];
  const name = names[Number(month) - 1];
  if (!name || !day || !year) return iso;
  return `${Number(day)} ${name} ${year}`;
}

export function TraceDisclosure({
  formula,
  inputs,
  ruleVersion,
  citation,
  compact = false,
  summaryLabel,
  className,
}: TraceDisclosureProps) {
  return (
    <div className={className}>
      <Disclosure
        summary="How this was calculated"
        summaryLabel={summaryLabel}
        compact={compact}
      >
        <div className="density-instrument">
          <p className="micro-label">Formula</p>
          <p
            className="num hairline-all mt-1 rounded-atlas p-2 text-ink"
            style={{
              backgroundColor: "var(--paper-sunken)",
              fontSize: "var(--text-step--1)",
              overflowWrap: "anywhere",
            }}
          >
            {formula}
          </p>

          {inputs.length > 0 ? (
            <>
              <p className="micro-label mt-3">Inputs used</p>
              <dl className="mt-1">
                {inputs.map((input) => (
                  <div
                    key={input.label}
                    className="hairline-b flex items-baseline justify-between gap-4 py-[6px]"
                  >
                    <dt className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                      {input.label}
                    </dt>
                    <dd className="num num-cell text-ink" style={{ fontSize: "var(--text-step--1)" }}>
                      {input.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}

          <p className="mt-3 text-dim" style={{ fontSize: "var(--text-step--2)" }}>
            Rule set <span className="num">{ruleVersion}</span> · last verified{" "}
            <span className="num">{formatIsoDate(citation.lastVerified)}</span>
          </p>
          <p style={{ fontSize: "var(--text-step--2)" }}>
            <a
              href={citation.url}
              className="text-ink underline underline-offset-2"
              // Same tab on purpose: the scenario lives in the URL and in
              // localStorage, so Back returns the reader to exactly this state
              // and no "opens in a new window" announcement is owed.
            >
              {citation.label}
            </a>
          </p>
        </div>
      </Disclosure>
    </div>
  );
}
