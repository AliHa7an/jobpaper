"use client";

/**
 * RadioGroup — native radios, grouped.
 *
 * Native inputs sharing a `name` already give roving tabindex, arrow-key
 * selection and correct screen-reader semantics for free; re-implementing that
 * in JavaScript only loses fidelity. The control itself is drawn by the UA with
 * `accent-color: var(--ink)`, which keeps the checked mark inside the palette.
 *
 * Labelling: the group takes its accessible name from `${name}-label`, which is
 * the id <Field> puts on its own label. So the intended usage is
 *   <Field label="Repayment goal" htmlFor="goal"><RadioGroup name="goal" …/></Field>
 * Pass `labelledBy` explicitly when the group is used outside a Field.
 *
 * Each row is a 44px target, so the label text is part of the hit area.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export interface RadioOption {
  value: string;
  label: string;
  /** One short clarifying line. Never a paragraph. */
  hint?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  orientation?: "horizontal" | "vertical";
  /** id of the element naming this group. Defaults to Field's `${name}-label`. */
  labelledBy?: string;
  describedBy?: string;
  disabled?: boolean;
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  orientation = "vertical",
  labelledBy,
  describedBy,
  disabled = false,
  className,
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy ?? `${name}-label`}
      aria-describedby={describedBy}
      className={cx(
        "flex",
        orientation === "horizontal" ? "flex-row flex-wrap gap-x-6 gap-y-1" : "flex-col",
        className,
      )}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        const isDisabled = disabled || option.disabled === true;
        return (
          <div key={option.value} className="flex flex-col">
            <label
              htmlFor={id}
              className={cx(
                "flex min-h-11 items-center gap-2.5 py-1.5",
                isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              )}
            >
              <input
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={value === option.value}
                disabled={isDisabled}
                onChange={() => onChange(option.value)}
                aria-describedby={option.hint ? `${id}-hint` : undefined}
                className="size-[18px] shrink-0"
                style={{ accentColor: "var(--ink)" }}
              />
              <span className="text-ink" style={{ fontSize: "var(--text-step-0)" }}>
                {option.label}
              </span>
            </label>
            {option.hint ? (
              <p
                id={`${id}-hint`}
                className="mt-[-4px] mb-1.5 pl-[26px] text-dim"
                style={{ fontSize: "var(--text-step--1)" }}
              >
                {option.hint}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
