"use client";

/**
 * Select — a native <select> in ledger dress.
 *
 * Native because the platform control is the accessible one, works on every
 * mobile keyboard, and never traps focus. Only the chrome is replaced: the UA
 * arrow is removed and a hand-rolled chevron is drawn in `currentColor`.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** ~3.2:1 against --paper — meets WCAG 2.2 AA 1.4.11 for a control boundary. */
const CONTROL_BORDER = "color-mix(in srgb, var(--ink) 55%, transparent)";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type PassThrough = Omit<
  React.ComponentPropsWithRef<"select">,
  "value" | "onChange" | "id" | "children"
>;

export interface SelectProps extends PassThrough {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Renders a leading, unselectable option — for "choose one" states only. */
  placeholder?: string;
}

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  className,
  style,
  disabled,
  ...rest
}: SelectProps) {
  const invalid = rest["aria-invalid"] === true || rest["aria-invalid"] === "true";

  return (
    <div className={cx("relative", className)}>
      <select
        {...rest}
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={cx(
          "w-full min-h-11 appearance-none rounded-atlas pr-9 pl-3 text-ink",
          "transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        )}
        style={{
          backgroundColor: "var(--paper-sunken)",
          border: `1px solid ${invalid ? "var(--ink)" : CONTROL_BORDER}`,
          transitionDuration: "var(--dur-fast)",
          transitionTimingFunction: "var(--ease)",
          ...style,
        }}
      >
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-dim"
      >
        <path d="M3.5 6 8 10.5 12.5 6" />
      </svg>
    </div>
  );
}
