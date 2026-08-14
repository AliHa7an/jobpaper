"use client";

/**
 * Disclosure — expands in place over `--dur-base` (200ms). Never a modal.
 *
 * This is the trace-on-tap mechanic's carrier: every figure in the product can
 * open its formula, inputs, rule version and citation without leaving the page
 * or losing the number it explains. Escape closes and returns focus to the
 * summary button.
 *
 * The height animation uses a `grid-template-rows: 0fr → 1fr` transition, so
 * nothing has to be measured in JavaScript and the content can be any height.
 * Under `prefers-reduced-motion` the token collapses to 0ms and it simply
 * appears — no extra media query needed here.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export interface DisclosureProps {
  summary: React.ReactNode;
  defaultOpen?: boolean;
  /** Accessible name for the toggle when `summary` is not plain text. */
  summaryLabel?: string;
  /**
   * Quiet, inline trigger instead of a full-width bar.
   *
   * Use when the same disclosure repeats down a list — nine full-width
   * "How this was calculated" bars in a nine-row ledger read as nine banners
   * competing with the figures they explain. Compact keeps the affordance on
   * every row (the invariant) while letting the numbers stay the loudest thing
   * in the table.
   */
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Disclosure({
  summary,
  defaultOpen = false,
  summaryLabel,
  compact = false,
  className,
  children,
}: DisclosureProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();
  const panelId = `${id}-panel`;
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  return (
    <div className={className} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        id={`${id}-summary`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={summaryLabel}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          "flex min-h-11 items-center gap-2 rounded-atlas text-left transition-colors",
          compact ? "w-auto text-dim hover:text-ink" : "w-full text-ink hover:text-ink/70",
        )}
        style={{
          fontSize: compact ? "var(--text-step--2)" : "var(--text-step--1)",
          transitionDuration: "var(--dur-fast)",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
          className="shrink-0"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform var(--dur-fast) var(--ease)",
          }}
        >
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
        <span>{summary}</span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={`${id}-summary`}
        aria-hidden={!open}
        className="grid"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows var(--dur-base) var(--ease)",
        }}
      >
        <div className={cx("overflow-hidden", open ? "visible" : "invisible")}>
          <div className="pt-2 pb-1 text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
