"use client";

/**
 * NumberInput — the field the whole product is typed into.
 *
 * Behaviour (interaction spec §3, "Input ergonomics"):
 *   • data face, right-aligned, thousands separators inserted LIVE as you type,
 *     with the caret held in place across reformatting;
 *   • ↑/↓ nudge by `step`, shift+↑/↓ by `step * 10`;
 *   • validates as you type and shows the CONSTRAINT ("Rate is usually 3–9%"),
 *     never a scolding;
 *   • a non-numeric keystroke can never corrupt the value — every keystroke is
 *     sanitised to digits (plus one decimal point, plus a leading minus where
 *     negatives are allowed) before it is parsed.
 *
 * The value is ALWAYS the canonical integer in the given `unit`. The formatted
 * string is display-only and never escapes the component. Parsing shifts the
 * decimal by string surgery rather than multiplying floats, so 1,250.37 dollars
 * becomes exactly 125037 cents — no binary-float drift on money.
 *
 * Canonical encodings
 * ─────────────────────────────────────────────────────────────────────────────
 *   cents  integer cents            125037  → "$1,250.37"   step 100000 ($1,000)
 *   bps    hundredths of a percent  639     → "6.39%"       step 25  (0.25 pp)
 *   pct    tenths of a percent      55      → "5.5%"        step 10  (1.0 pp)
 *   count  integer                  12      → "12"          step 1
 *   year   integer calendar year    2026    → "2026"        step 1  (no commas)
 *   hundredths  hundredths of a unit  21120   → "211.2"      step 100 (1 unit)
 *
 * Two notes on the defaults, both deliberate:
 *   1. The interaction spec asks for a ±0.125% nudge on rates. Under the
 *      engine's integer basis-point encoding (CLAUDE.md: "6.39% → 639") that is
 *      12.5 bp — not representable. The step is a quarter point (25 bp), the
 *      conventional rate increment, so shift+arrow moves 2.5 pp and spans the
 *      plausible federal rate range in a few presses.
 *   2. `pct` is stored in tenths of a percent so that display honours the
 *      "percentages, one decimal max" rule exactly and the default step of 10
 *      is a clean one-percentage-point nudge.
 */

import * as React from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** ~3.2:1 against --paper — meets WCAG 2.2 AA 1.4.11 for a control boundary. */
const CONTROL_BORDER = "color-mix(in srgb, var(--ink) 55%, transparent)";

export type NumberUnit = "cents" | "bps" | "count" | "pct" | "year" | "hundredths";

interface UnitSpec {
  /** default nudge, in canonical units */
  step: number;
  /** decimal places between the canonical integer and the displayed number */
  digits: number;
  /** insert thousands separators (never for a calendar year) */
  group: boolean;
  prefix?: string;
  suffix?: string;
  /** how the value is spoken, appended to aria-valuetext */
  spoken: (display: string) => string;
}

const UNITS: Record<NumberUnit, UnitSpec> = {
  cents: {
    step: 100000,
    digits: 2,
    group: true,
    prefix: "$",
    spoken: (d) => `${d} dollars`,
  },
  bps: { step: 25, digits: 2, group: false, suffix: "%", spoken: (d) => `${d} percent` },
  pct: { step: 10, digits: 1, group: false, suffix: "%", spoken: (d) => `${d} percent` },
  count: { step: 1, digits: 0, group: true, spoken: (d) => d },
  year: { step: 1, digits: 0, group: false, spoken: (d) => d },
  /**
   * JobPaper addition: a bare two-decimal quantity, encoded the same way
   * `cents` is — the canonical integer is hundredths of the displayed number.
   * A takeoff sheet's quantities and labor hours are genuinely fractional
   * (211.2 sq ft, 12.75 hrs) and the engine emits them at 2dp, so rounding
   * them into `count` would put a different number on the sheet than the one
   * the total was computed from. Default step 100 = one whole unit.
   */
  hundredths: { step: 100, digits: 2, group: true, spoken: (d) => d },
};

/* ── string helpers ─────────────────────────────────────────────────────── */

function isSignificant(ch: string | undefined): boolean {
  return ch !== undefined && ((ch >= "0" && ch <= "9") || ch === "." || ch === "-");
}

function countSignificant(s: string): number {
  let n = 0;
  for (const ch of s) if (isSignificant(ch)) n += 1;
  return n;
}

function groupDigits(intPart: string): string {
  let out = "";
  for (let i = 0; i < intPart.length; i += 1) {
    const fromEnd = intPart.length - i;
    out += intPart[i] ?? "";
    if (fromEnd > 1 && (fromEnd - 1) % 3 === 0) out += ",";
  }
  return out;
}

/**
 * Reduce whatever is now in the field to digits, at most one decimal point and
 * at most `digits` decimals, plus an optional leading minus. Group separators,
 * letters, "e", "+", stray symbols — all dropped. This is what guarantees a
 * keystroke can never corrupt the value.
 */
function sanitize(raw: string, digits: number, allowNegative: boolean): string {
  let out = "";
  let seenDot = false;
  let fracLen = 0;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      if (seenDot) {
        if (fracLen >= digits) continue;
        fracLen += 1;
      }
      out += ch;
    } else if (ch === "." && digits > 0 && !seenDot) {
      seenDot = true;
      out += ".";
    } else if (ch === "-" && allowNegative && out.length === 0) {
      out += "-";
    }
  }
  return out;
}

/** Format a mid-typing sanitised string: group the integer part, keep the tail. */
function formatTyped(sanitized: string, group: boolean): string {
  const negative = sanitized.startsWith("-");
  const body = negative ? sanitized.slice(1) : sanitized;
  const dot = body.indexOf(".");
  const intPart = dot === -1 ? body : body.slice(0, dot);
  const fracPart = dot === -1 ? null : body.slice(dot + 1);
  const int = group ? groupDigits(intPart) : intPart;
  return `${negative ? "-" : ""}${int}${fracPart === null ? "" : `.${fracPart}`}`;
}

/**
 * Sanitised string → canonical integer, by shifting the decimal point through
 * string surgery. Never multiplies by a power of ten, so no float drift.
 */
function toCanonical(sanitized: string, digits: number): number {
  const negative = sanitized.startsWith("-");
  const body = negative ? sanitized.slice(1) : sanitized;
  if (body === "" || body === ".") return 0;
  const dot = body.indexOf(".");
  const intPart = (dot === -1 ? body : body.slice(0, dot)) || "0";
  const fracRaw = dot === -1 ? "" : body.slice(dot + 1);
  const frac = `${fracRaw}${"0".repeat(digits)}`.slice(0, digits);
  const n = Number(`${intPart}${frac}`);
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

/** Canonical integer → display string. Trailing zero decimals are dropped, so
 *  cents show up only when they matter: "$1,204", but "$1,204.37". */
function fromCanonical(value: number, digits: number, group: boolean): string {
  const negative = value < 0;
  const abs = Math.abs(Math.round(value));
  const padded = String(abs).padStart(digits + 1, "0");
  const cut = padded.length - digits;
  const intPart = padded.slice(0, cut);
  const frac = digits > 0 ? padded.slice(cut).replace(/0+$/, "") : "";
  const int = group ? groupDigits(intPart) : intPart;
  return `${negative ? "-" : ""}${int}${frac ? `.${frac}` : ""}`;
}

function caretAfterSignificant(formatted: string, count: number): number {
  if (count <= 0) {
    let i = 0;
    while (i < formatted.length && !isSignificant(formatted[i])) i += 1;
    return i;
  }
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (isSignificant(formatted[i])) {
      seen += 1;
      if (seen === count) return i + 1;
    }
  }
  return formatted.length;
}

function clamp(n: number, min: number | undefined, max: number | undefined): number {
  let out = n;
  if (min !== undefined && out < min) out = min;
  if (max !== undefined && out > max) out = max;
  return out;
}

/* ── component ──────────────────────────────────────────────────────────── */

type PassThrough = Omit<
  React.ComponentPropsWithRef<"input">,
  "value" | "onChange" | "step" | "min" | "max" | "type" | "id"
>;

export interface NumberInputProps extends PassThrough {
  id: string;
  /** canonical value in `unit` — always an integer */
  value: number;
  onChange: (n: number) => void;
  unit: NumberUnit;
  /** nudge per arrow key, in canonical units. Defaults per unit. */
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  /**
   * "Rate is usually 3–9%" — the constraint, shown as guidance, never a scold.
   * A ReactNode rather than a string so the figures inside it can be wrapped
   * in `.num`: a hint that is mostly digits set in the body face breaks the
   * "every number in the data face" rule as surely as a table cell does.
   */
  constraintHint?: React.ReactNode;
}

export function NumberInput({
  id,
  value,
  onChange,
  unit,
  step,
  min,
  max,
  placeholder,
  constraintHint,
  className,
  style,
  onKeyDown,
  onBlur,
  disabled,
  ...rest
}: NumberInputProps) {
  const spec = UNITS[unit];
  const nudge = step ?? spec.step;
  const allowNegative = min === undefined ? false : min < 0;

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const caretRef = React.useRef<number | null>(null);
  const emittedRef = React.useRef(value);
  const [text, setText] = React.useState(() => fromCanonical(value, spec.digits, spec.group));

  // Keep the display in step with an externally-changed value (a clamp upstream,
  // a scenario restore, a pinned state). Typing does not trip this: what comes
  // back is the canonical number we just emitted, so the half-typed string
  // ("1." while the user reaches for a decimal) is left alone.
  React.useEffect(() => {
    if (value === emittedRef.current) return;
    emittedRef.current = value;
    setText(fromCanonical(value, spec.digits, spec.group));
  }, [value, spec.digits, spec.group]);

  React.useLayoutEffect(() => {
    const pos = caretRef.current;
    if (pos === null) return;
    caretRef.current = null;
    const el = inputRef.current;
    if (!el || document.activeElement !== el) return;
    el.setSelectionRange(pos, pos);
  }, [text]);

  const display = text;
  const outOfRange =
    (min !== undefined && value < min) || (max !== undefined && value > max);

  /** Apply an arbitrary raw field string with a caret offset into it. */
  const applyRaw = React.useCallback(
    (raw: string, caret: number) => {
      const significantBefore = countSignificant(raw.slice(0, caret));
      const sanitized = sanitize(raw, spec.digits, allowNegative);
      const formatted = formatTyped(sanitized, spec.group);
      caretRef.current = caretAfterSignificant(formatted, significantBefore);
      setText(formatted);
      const next = toCanonical(sanitized, spec.digits);
      if (next !== value) {
        emittedRef.current = next;
        onChange(next);
      }
    },
    [allowNegative, onChange, spec.digits, spec.group, value],
  );

  /** Commit a canonical number: clamp, reformat, emit, caret to the end. */
  const commit = React.useCallback(
    (next: number) => {
      const clamped = clamp(Math.round(next), min, max);
      const formatted = fromCanonical(clamped, spec.digits, spec.group);
      caretRef.current = formatted.length;
      setText(formatted);
      if (clamped !== value) {
        emittedRef.current = clamped;
        onChange(clamped);
      }
    },
    [max, min, onChange, spec.digits, spec.group, value],
  );

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const el = event.currentTarget;
    applyRaw(el.value, el.selectionStart ?? el.value.length);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? 1 : -1;
      const magnitude = event.shiftKey ? nudge * 10 : nudge;
      commit(value + direction * magnitude);
      return;
    }

    const el = event.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === null || end === null || start !== end) return;

    // Backspacing "onto" a group separator should delete the digit behind it,
    // not silently do nothing while the comma is re-inserted.
    if (event.key === "Backspace" && start >= 2 && el.value[start - 1] === ",") {
      event.preventDefault();
      applyRaw(`${el.value.slice(0, start - 2)}${el.value.slice(start)}`, start - 2);
      return;
    }
    // Symmetrically, Delete on a separator removes the digit in front of it.
    if (event.key === "Delete" && el.value[start] === ",") {
      event.preventDefault();
      applyRaw(`${el.value.slice(0, start)}${el.value.slice(start + 2)}`, start);
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    // Canonicalise on the way out: strip typed leading zeros and a dangling
    // decimal point, and bring an out-of-range entry back inside its bounds.
    commit(clamp(value, min, max));
    onBlur?.(event);
  }

  const constraintId = constraintHint ? `${id}-constraint` : undefined;
  const describedBy =
    [rest["aria-describedby"], constraintId].filter(Boolean).join(" ") || undefined;

  const invalid =
    rest["aria-invalid"] === true || rest["aria-invalid"] === "true" || outOfRange;

  const valueText = spec.spoken(
    `${spec.prefix ?? ""}${fromCanonical(value, spec.digits, spec.group)}`,
  );

  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <div className="relative">
        {spec.prefix ? (
          <span
            aria-hidden="true"
            className="num pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim"
          >
            {spec.prefix}
          </span>
        ) : null}

        <input
          {...rest}
          ref={inputRef}
          id={id}
          type="text"
          inputMode={spec.digits > 0 ? "decimal" : "numeric"}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={valueText}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={display}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cx(
            "num w-full min-h-11 rounded-atlas text-right text-ink",
            spec.prefix ? "pl-7" : "pl-3",
            spec.suffix ? "pr-7" : "pr-3",
            "placeholder:text-dim transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          style={{
            backgroundColor: "var(--paper-sunken)",
            border: `1px solid ${invalid ? "var(--ink)" : CONTROL_BORDER}`,
            transitionDuration: "var(--dur-fast)",
            transitionTimingFunction: "var(--ease)",
            ...style,
          }}
        />

        {spec.suffix ? (
          <span
            aria-hidden="true"
            className="num pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-dim"
          >
            {spec.suffix}
          </span>
        ) : null}
      </div>

      {constraintHint ? (
        <p
          id={constraintId}
          aria-live="polite"
          className={cx(
            "flex items-start gap-1.5",
            outOfRange ? "font-medium text-ink" : "text-dim",
          )}
          style={{ fontSize: "var(--text-step--1)" }}
        >
          {outOfRange ? (
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
          ) : null}
          <span>{constraintHint}</span>
        </p>
      ) : null}
    </div>
  );
}
