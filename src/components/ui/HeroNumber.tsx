"use client";

import * as React from "react";

import { LiveNumber } from "./LiveNumber";

/**
 * HeroNumber — the one large number per screen. Maximum one.
 *
 * §3 of the design system: "the one hero number per screen at --step-4,
 * weight 500, with a micro-label above it. That's the only place a number gets
 * to be large." The discipline is the point — if two things on a page are this
 * size, neither reads as the answer.
 *
 * The only addition JobPaper makes to the ported component: an optional
 * `tween`, which routes the figure through <LiveNumber> (M2) so the running
 * total counts to its new value instead of jumping. It is opt-in, changes no
 * default, and exists because in this app the hero number IS the thing the
 * user is editing — watching it move is how the sheet reads as live. Tabular
 * figures mean the tween cannot shift a pixel of layout; reduced motion swaps
 * instantly (LiveNumber checks matchMedia itself).
 */

export type HeroNumberDelta = {
  /** Signed. Negative renders with a minus sign, never parentheses. */
  value: number;
  /** What the delta is measured against: "vs Standard over 30 years". */
  label: string;
  /**
   * Overrides the mechanical sign→colour rule. Needed because a *negative*
   * delta is usually the good outcome here (paying less), and painting a
   * saving in oxide red would break the flag law. Default is "auto":
   * negative → flag, positive → ink.
   */
  tone?: "auto" | "signal" | "flag" | "neutral";
};

export type HeroNumberProps = {
  /** The micro-label above the figure. Sentence case; rendered in caps by CSS. */
  label: string;
  value: number;
  /** From `@/lib/format` — formatCents, formatPct, formatMonths. */
  format: (n: number) => string;
  delta?: HeroNumberDelta;
  /**
   * The "how this was calculated" affordance. Never state a computed figure
   * without one — pass a <TraceDisclosure> or <SourceCitation> here.
   */
  footnote?: React.ReactNode;
  /** Ties the figure to its own label for assistive tech. */
  id?: string;
  /** Count to the new value over `tweenMs` instead of jumping to it. */
  tween?: boolean;
  /** Defaults to --dur-base (200ms). The signature moment passes 700. */
  tweenMs?: number;
  className?: string;
};

export function HeroNumber({
  label,
  value,
  format,
  delta,
  footnote,
  id,
  tween = false,
  tweenMs,
  className,
}: HeroNumberProps) {
  const labelId = id ? `${id}-label` : undefined;

  return (
    <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
      <span className="micro-label" id={labelId}>
        {label}
      </span>

      <span
        id={id}
        aria-labelledby={labelId}
        className="num text-ink"
        style={{
          fontSize: "var(--text-step-4)",
          fontWeight: 500,
          lineHeight: 1.1,
          letterSpacing: "-0.011em",
        }}
      >
        {tween ? <LiveNumber value={value} format={format} durationMs={tweenMs} /> : format(value)}
      </span>

      {delta ? <DeltaLine delta={delta} format={format} /> : null}

      {footnote ? (
        <div className="mt-1" style={{ fontSize: "var(--text-step--1)" }}>
          {footnote}
        </div>
      ) : null}
    </div>
  );
}

function DeltaLine({
  delta,
  format,
}: {
  delta: HeroNumberDelta;
  format: (n: number) => string;
}) {
  const tone = delta.tone ?? "auto";
  const negative = delta.value < 0;

  // The sign is always carried by the glyph, so colour is never doing the work
  // alone: formatters emit U+2212 for negatives and we prefix "+" for gains.
  const magnitude = format(Math.abs(delta.value));
  const signed = negative ? `−${magnitude}` : `+${magnitude}`;

  const toneClass =
    tone === "auto"
      ? negative
        ? "num-negative"
        : "text-ink"
      : tone === "signal"
        ? "text-signal"
        : tone === "flag"
          ? "num-negative"
          : "text-ink";

  return (
    <span
      className="flex items-baseline gap-2"
      style={{ fontSize: "var(--text-step--1)" }}
    >
      <span className={`num ${toneClass}`} style={{ fontWeight: 500 }}>
        {signed}
      </span>
      <span className="text-dim">{delta.label}</span>
    </span>
  );
}
