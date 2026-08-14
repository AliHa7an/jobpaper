"use client";

import * as React from "react";

/**
 * LedgerTable — the single most credible object we can put on a screen.
 *
 * Instrument density (8px vertical / 12px horizontal cell padding, 32px rows),
 * hairline rules, numerics right-aligned in the data face so decimal points
 * stack down the column. Separation comes from hairlines and one half-step of
 * background — there is no elevation anywhere in this system.
 *
 * The winning row gets a low-alpha `--signal` wash plus a left rule, never a
 * saturated fill: the table must still read as a document, not a dashboard.
 * Ineligible rows are greyed and carry their reason INLINE — a bare "N/A" or
 * an empty cell makes the user do the work of guessing, which is exactly the
 * failure this product exists to prevent.
 *
 * Client-side only because a row may reveal its calculation trace in place.
 */

export type LedgerColumn = {
  id: string;
  label: string;
  align?: "left" | "right";
  /** Renders the cell through `.num .num-cell`. Implies right alignment. */
  numeric?: boolean;
};

export type LedgerRow = {
  id: string;
  /** Keyed by column id. Values are already formatted — this table never does math. */
  cells: Record<string, React.ReactNode>;
  /** The recommended outcome. At most one row should carry this. */
  winner?: boolean;
  /** Greyed out. MUST be accompanied by `disabledReason`. */
  disabled?: boolean;
  /** Concrete and specific: "Parent PLUS loans cannot enter RAP, even after consolidation." */
  disabledReason?: React.ReactNode;
  /** Revealed in place by a disclosure in the row. Usually a <TraceDisclosure>. */
  trace?: React.ReactNode;
};

export type LedgerTableProps = {
  columns: LedgerColumn[];
  rows: LedgerRow[];
  /**
   * Describes what the table ranks and by what. Visually hidden by default;
   * it exists so a screen reader reaches the table already oriented.
   */
  caption: string;
  /** Show the caption above the table instead of hiding it. */
  captionVisible?: boolean;
  className?: string;
};

const CELL_STYLE: React.CSSProperties = {
  paddingBlock: "var(--cell-pad-y)",
  paddingInline: "var(--cell-pad-x)",
};

export function LedgerTable({
  columns,
  rows,
  caption,
  captionVisible = false,
  className,
}: LedgerTableProps) {
  const [openTrace, setOpenTrace] = React.useState<string | null>(null);
  const firstColumn = columns[0];

  if (!firstColumn) return null;

  const dataColumns = columns.slice(1);
  const spanRest = Math.max(1, dataColumns.length);

  return (
    // The scroll lives HERE, inside the component's own box. `min-w-0` stops a
    // flex or grid parent from letting the table push the page wide, which is
    // what makes 375px hold without the body scrolling.
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={[
        "density-instrument w-full min-w-0 overflow-x-auto hairline-all rounded-atlas",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper)" }}
    >
      {/*
       * An explicit min-width rather than `max-content`: numeric cells never
       * wrap (`.num-cell`), so the columns stay legible, while a long
       * ineligibility reason wraps instead of dragging the table 600px wide.
       */}
      <table
        className="w-full border-collapse text-left"
        style={{ minWidth: `${Math.max(320, columns.length * 112)}px` }}
      >
        <caption
          className={captionVisible ? "text-dim text-left" : "sr-only"}
          style={captionVisible ? { ...CELL_STYLE, captionSide: "top" } : undefined}
        >
          {caption}
        </caption>

        <thead>
          <tr className="hairline-b">
            {columns.map((column, index) => (
              <th
                key={column.id}
                scope="col"
                className={[
                  "micro-label align-bottom",
                  column.numeric || column.align === "right" ? "num-cell" : "text-left",
                ].join(" ")}
                style={{
                  ...CELL_STYLE,
                  // Reserve the winner's left rule on every row so marking a
                  // winner shifts nothing by a pixel.
                  ...(index === 0 ? { borderLeft: "2px solid transparent" } : null),
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const isOpen = openTrace === row.id;
            const traceId = `${row.id}-trace`;

            return (
              <React.Fragment key={row.id}>
                <tr
                  className={["hairline-b", row.disabled ? "text-dim" : "text-ink"]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    row.winner
                      ? {
                          // A wash, not a fill. 6% keeps the row's own text at
                          // full AA contrast against it.
                          background: "color-mix(in srgb, var(--signal) 6%, var(--paper))",
                        }
                      : undefined
                  }
                >
                  <th
                    scope="row"
                    className="text-left align-top"
                    style={{
                      ...CELL_STYLE,
                      height: "var(--row-h)",
                      fontWeight: row.winner ? 600 : 500,
                      borderLeft: row.winner
                        ? "2px solid var(--signal)"
                        : "2px solid transparent",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {row.trace ? (
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={traceId}
                          onClick={() => setOpenTrace(isOpen ? null : row.id)}
                          className="inline-flex items-center gap-1.5 rounded-atlas text-left underline decoration-rule underline-offset-4 hover:decoration-current"
                          style={{
                            borderRadius: "var(--radius-atlas)",
                            transitionDuration: "var(--dur-fast)",
                            transitionTimingFunction: "var(--ease)",
                          }}
                        >
                          <Chevron open={isOpen} />
                          {row.cells[firstColumn.id] ?? row.id}
                          <span className="sr-only">
                            {isOpen ? " — hide calculation" : " — show calculation"}
                          </span>
                        </button>
                      ) : (
                        (row.cells[firstColumn.id] ?? row.id)
                      )}

                      {row.winner ? <WinnerMark /> : null}
                    </span>
                  </th>

                  {row.disabled ? (
                    // One cell, spanning the data columns, carrying the reason.
                    // Never a bare "N/A"; never an empty cell.
                    <td
                      colSpan={spanRest}
                      className="align-top text-dim"
                      style={{ ...CELL_STYLE, height: "var(--row-h)" }}
                    >
                      <span className="flex items-start gap-1.5">
                        <BlockedMark />
                        <span>
                          <span style={{ fontWeight: 600 }}>Not eligible</span>
                          {row.disabledReason ? <> — {row.disabledReason}</> : null}
                        </span>
                      </span>
                    </td>
                  ) : (
                    dataColumns.map((column) => {
                      const numeric = column.numeric || column.align === "right";
                      return (
                        <td
                          key={column.id}
                          className={[
                            "align-top",
                            numeric ? "num num-cell" : "text-left",
                          ].join(" ")}
                          style={{ ...CELL_STYLE, height: "var(--row-h)" }}
                        >
                          {row.cells[column.id] ?? <MissingCell />}
                        </td>
                      );
                    })
                  )}
                </tr>

                {row.trace && isOpen ? (
                  <tr className="hairline-b">
                    <td
                      id={traceId}
                      colSpan={columns.length}
                      style={{
                        ...CELL_STYLE,
                        background: "var(--paper-raised)",
                        borderLeft: "2px solid transparent",
                      }}
                    >
                      {row.trace}
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A cell with no value still says why. This is the last line of defence
 * against a blank square appearing in a table people make decisions from.
 */
function MissingCell() {
  return (
    <span className="text-dim" title="This plan produces no figure for this column">
      <span aria-hidden="true">—</span>
      <span className="sr-only">not applicable to this plan</span>
    </span>
  );
}

function WinnerMark() {
  return (
    <span className="micro-label text-signal inline-flex items-center gap-1 whitespace-nowrap">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M2 6.5 L4.8 9.3 L10 3.2" />
      </svg>
      Recommended
    </span>
  );
}

function BlockedMark() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none", marginTop: "0.15em" }}
    >
      <circle cx="7" cy="7" r="5.5" />
      <path d="M3.1 10.9 L10.9 3.1" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 10 10"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{
        flex: "none",
        transform: open ? "rotate(90deg)" : "none",
        transition: "transform var(--dur-fast) var(--ease)",
      }}
    >
      <path d="M2 0.5 L8.5 5 L2 9.5 Z" />
    </svg>
  );
}
