import * as React from "react";

/**
 * WarningStack — renders NOTHING when the list is empty.
 *
 * There is no "no warnings" state, no green all-clear panel, no empty box with
 * a checkmark. An absent warning stack means there is nothing to warn about,
 * and reserving space for reassurance would train the user to skim past the
 * one screen where the stack is populated.
 *
 * THE FLAG LAW. `--flag` (oxide red) marks facts the user cannot undo. Two
 * flag-coloured items on a page must mean two irreversible things. So
 * "caution" severity is deliberately NOT red — it takes ink and dim treatment.
 * If everything is red, red means nothing and the RAP forfeiture warning —
 * the one that actually costs people years of payment credit — stops landing.
 *
 * Copy rule: every warning is a concrete sentence with the user's own number
 * in it. "Switching to RAP forfeits your 34 qualifying payments. This cannot
 * be undone." Never "Warning: please review carefully."
 *
 * Server-renderable. For warnings that appear and disappear as inputs change,
 * use <LiveWarnings> (M6), which wraps this with enter/exit behaviour.
 */

export type WarningSeverity = "irreversible" | "caution";

export type Warning = {
  id: string;
  severity: WarningSeverity;
  /** The concrete claim. Wrap figures in <span className="num"> so they set in the data face. */
  title: React.ReactNode;
  /** What it means and what to do. One qualifier maximum. */
  body?: React.ReactNode;
  /**
   * Overrides the severity's own word ("Irreversible" / "Check this").
   * Colour is never the sole carrier of meaning, so this label is doing real
   * work — it must name the category concretely ("Unverified pricing",
   * "Template only"), never soften it ("Note", "Heads up").
   */
  label?: string;
};

export type WarningStackProps = {
  warnings: Warning[];
  /** Optional section title. Rendered as <h2> — the display face is h1/h2 only. */
  heading?: string;
  className?: string;
};

export function WarningStack({ warnings, heading, className }: WarningStackProps) {
  if (warnings.length === 0) return null;

  return (
    <section
      aria-label={heading ?? "Warnings"}
      className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}
    >
      {heading ? <h2>{heading}</h2> : null}
      <ul className="flex list-none flex-col gap-2 p-0">
        {warnings.map((warning) => (
          <WarningItem key={warning.id} warning={warning} />
        ))}
      </ul>
    </section>
  );
}

function WarningItem({ warning }: { warning: Warning }) {
  const irreversible = warning.severity === "irreversible";

  return (
    <li
      className="flex gap-3 rounded-atlas"
      style={{
        borderRadius: "var(--radius-atlas)",
        // A left rule and a half-step of background. No card, no shadow.
        borderLeft: irreversible ? "2px solid var(--flag)" : "2px solid var(--rule)",
        background: irreversible
          ? "color-mix(in srgb, var(--flag) 5%, var(--paper))"
          : "var(--paper-raised)",
        padding: "12px 16px",
      }}
    >
      <span
        className={irreversible ? "text-flag" : "text-dim"}
        style={{ flex: "none", marginTop: "0.2em", lineHeight: 0 }}
      >
        {irreversible ? <IrreversibleIcon /> : <CautionIcon />}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        {/* Colour never carries meaning alone: the icon and this word do too. */}
        <span className={`micro-label ${irreversible ? "text-flag" : "text-dim"}`}>
          {warning.label ?? (irreversible ? "Irreversible" : "Check this")}
        </span>

        <p className="text-ink" style={{ fontWeight: 600, margin: 0 }}>
          {warning.title}
        </p>

        {warning.body ? (
          <p
            className="text-dim"
            style={{ fontSize: "var(--text-step--1)", margin: 0, maxWidth: "var(--measure)" }}
          >
            {warning.body}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/** A one-way door: an arrow that cannot come back. */
function IrreversibleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1.4 8 H12.2" />
      <path d="M8.6 4.4 L12.2 8 L8.6 11.6" />
      <path d="M14.6 2.6 V13.4" />
    </svg>
  );
}

/** Attention, not alarm. */
function CautionIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.4" />
      <path d="M8 4.6 V8.6" />
      <path d="M8 10.9 V11.1" />
    </svg>
  );
}
