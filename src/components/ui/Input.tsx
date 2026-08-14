"use client";

/**
 * Input — plain text. Labels, hints and errors live in <Field>, never here.
 *
 * The border reads `aria-invalid` off its own props (Field injects it), so the
 * invalid state is expressed without a second border width — a 1px→2px swap
 * would move the layout, and CLS is an invariant. Border colour clears the 3:1
 * non-text contrast floor against `--paper`; `--rule` alone does not, so it is
 * used for dividers rather than for control boundaries.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** ~3.2:1 against --paper — meets WCAG 2.2 AA 1.4.11 for a control boundary. */
export const CONTROL_BORDER = "color-mix(in srgb, var(--ink) 55%, transparent)";

export interface InputProps extends React.ComponentPropsWithRef<"input"> {
  id: string;
}

export function Input({ className, style, ...props }: InputProps) {
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  return (
    <input
      className={cx(
        "w-full min-h-11 rounded-atlas px-3 text-ink",
        "placeholder:text-dim transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      style={{
        backgroundColor: "var(--paper-sunken)",
        border: `1px solid ${invalid ? "var(--ink)" : CONTROL_BORDER}`,
        transitionDuration: "var(--dur-fast)",
        transitionTimingFunction: "var(--ease)",
        ...style,
      }}
      {...props}
    />
  );
}
