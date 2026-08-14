import * as React from "react";

/**
 * The three designed states. Never a default, never an afterthought.
 *
 * Loading — a skeleton that matches the final layout exactly, so the page does
 *   not reflow when real content lands. NO spinners on the primary path: the
 *   engine is synchronous and client-side, so results appear within a frame
 *   and a spinner would be theatre implying work that isn't happening.
 *   Skeletons belong on genuinely async surfaces only — document extraction,
 *   a PDF render.
 *
 * Empty — invites exactly ONE action. No illustration, no empty-box graphic.
 *
 * Error — names the cause and the fix, in the interface's voice, and never
 *   apologises: "This PDF has no readable text layer. Upload a clearer scan,
 *   or enter your loans manually →" Not "Sorry, something went wrong."
 *
 * None of these use --flag. A failed upload is recoverable; oxide red is
 * reserved for facts the user cannot undo, and spending it on a retryable
 * error is what makes the forfeiture warnings stop landing.
 *
 * All three are server-renderable — pass a <Button> as `action`.
 */

/* -------------------------------------------------------------------------- */
/* Loading                                                                     */
/* -------------------------------------------------------------------------- */

export type SkeletonBlockProps = {
  /** Number of stacked bars. Match the real content's line or row count. */
  lines?: number;
  /** Height of each bar in px. 32 mirrors an instrument-density table row. */
  lineHeight?: number;
  /** Widths per line, cycled. Uneven widths read as text; equal ones as a table. */
  widths?: string[];
  /** Announced to assistive tech while the skeleton is up. */
  label?: string;
  className?: string;
};

export function SkeletonBlock({
  lines = 3,
  lineHeight = 32,
  widths = ["100%"],
  label = "Loading",
  className,
}: SkeletonBlockProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={["flex w-full min-w-0 flex-col gap-2", className].filter(Boolean).join(" ")}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="block rounded-atlas motion-reduce:animate-none animate-pulse"
          style={{
            height: `${lineHeight}px`,
            width: widths[index % widths.length] ?? "100%",
            borderRadius: "var(--radius-atlas)",
            background: "var(--paper-sunken)",
          }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty                                                                       */
/* -------------------------------------------------------------------------- */

export type EmptyStateProps = {
  /** Rendered as <h2> — the display face lives in h1/h2 only. */
  heading?: string;
  /** The invitation. One sentence, naming what will happen. */
  message: React.ReactNode;
  /**
   * Exactly one action. The type is a single node on purpose: an empty state
   * offering three choices is a menu, and a menu is not an invitation.
   */
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ heading, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={["hairline-all rounded-atlas flex flex-col items-start gap-3", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderRadius: "var(--radius-atlas)",
        background: "var(--paper-raised)",
        padding: "24px",
      }}
    >
      {heading ? <h2>{heading}</h2> : null}
      <p className="text-dim" style={{ margin: 0, maxWidth: "var(--measure)" }}>
        {message}
      </p>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Error                                                                       */
/* -------------------------------------------------------------------------- */

export type ErrorStateProps = {
  /** What happened, stated as fact: "This PDF has no readable text layer." */
  cause: React.ReactNode;
  /** What to do about it: "Upload a clearer scan, or enter your loans manually →" */
  fix: React.ReactNode;
  /** Optional single recovery control. */
  action?: React.ReactNode;
  className?: string;
};

export function ErrorState({ cause, fix, action, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={["rounded-atlas flex gap-3", className].filter(Boolean).join(" ")}
      style={{
        borderRadius: "var(--radius-atlas)",
        // Ink, not flag. This is recoverable.
        borderLeft: "2px solid var(--ink)",
        background: "var(--paper-raised)",
        padding: "16px 20px",
      }}
    >
      <span className="text-ink" style={{ flex: "none", marginTop: "0.2em", lineHeight: 0 }}>
        <StopIcon />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-ink" style={{ fontWeight: 600, margin: 0 }}>
          {cause}
        </p>
        <p className="text-dim" style={{ margin: 0, maxWidth: "var(--measure)" }}>
          {fix}
        </p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

function StopIcon() {
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
      <rect x="1.6" y="1.6" width="12.8" height="12.8" />
      <path d="M5 5 L11 11" />
      <path d="M11 5 L5 11" />
    </svg>
  );
}
