"use client";

/**
 * Field — the ONLY place a label, hint or error is rendered.
 *
 * Because every field routes through here, the error always appears in exactly
 * the same position relative to its control, on every screen. Field also wires
 * the accessibility plumbing so no caller has to remember it: it clones its
 * control child to inject `aria-describedby` (pointing at the hint, or at the
 * error when one is present), `aria-invalid`, and `aria-required`.
 *
 * The error REPLACES the hint and is announced through a live region that is
 * always mounted (an empty <p>), so assistive tech reliably picks up the
 * change rather than missing a region that appeared at the same instant.
 *
 * Colour note: validation errors are set in `--ink`, not `--flag`. Oxide red is
 * reserved for irreversible or high-stakes facts (CLAUDE.md, "the flag law") —
 * a correctable typo is neither. The error is carried by weight, an inline
 * alert glyph, the word itself, and an ink border on the control, so colour is
 * never the sole signal.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function AlertGlyph() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className="mt-[3px] shrink-0"
    >
      <circle cx="8" cy="8" r="6.6" />
      <path d="M8 4.6v4.2" />
      <path d="M8 11.3h.01" />
    </svg>
  );
}

export interface FieldProps {
  label: React.ReactNode;
  /** Shown while the field is empty or valid. Replaced by `error`. */
  hint?: React.ReactNode;
  /** Replaces the hint and is announced via aria-live="polite". */
  error?: React.ReactNode;
  required?: boolean;
  /** id of the control this field labels. Also seeds the hint/error ids. */
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  className,
  children,
}: FieldProps) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  const labelId = `${htmlFor}-label`;

  const describedBy = error ? errorId : hint ? hintId : undefined;

  const controls = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const element = child as React.ReactElement<Record<string, unknown>>;
    const existing = element.props["aria-describedby"];
    const merged = [typeof existing === "string" ? existing : undefined, describedBy]
      .filter(Boolean)
      .join(" ");

    const injected: Record<string, unknown> = {};
    if (merged) injected["aria-describedby"] = merged;
    if (error) injected["aria-invalid"] = true;
    if (required) injected["aria-required"] = true;

    return React.cloneElement(element, injected);
  });

  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label
        id={labelId}
        htmlFor={htmlFor}
        className="font-medium text-ink"
        style={{ fontSize: "var(--text-step--1)" }}
      >
        {label}
        {required ? (
          <span className="micro-label ml-2 align-baseline" aria-hidden="true">
            required
          </span>
        ) : null}
      </label>

      {controls}

      <div>
        {hint && !error ? (
          <p id={hintId} className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
            {hint}
          </p>
        ) : null}
        {/* Always mounted so the live region exists before the error arrives. */}
        <p
          id={errorId}
          aria-live="polite"
          className={cx("flex gap-1.5 font-medium text-ink", !error && "sr-only")}
          style={{ fontSize: "var(--text-step--1)" }}
        >
          {error ? (
            <>
              <AlertGlyph />
              <span>{error}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
