import * as React from "react";

/**
 * FactTable — two-column key/value, mono values, hairline separated.
 *
 * Item 4 in the page skeleton: ONE clean table with the key numbers, and it is
 * a real <table> rather than a <dl> because it needs to be machine-parseable —
 * this is the block an AI Overview reads the figures out of.
 *
 * Instrument density throughout. Values set in the data face by default so a
 * column of figures aligns on its decimals; pass `mono: false` on a row whose
 * value is a sentence rather than a fact.
 */

export type FactRow = {
  key: string;
  value: React.ReactNode;
  /** Set false for prose values. Default true — figures, dates, codes, IDs. */
  mono?: boolean;
};

export type FactTableProps = {
  rows: FactRow[];
  /** Visually hidden unless `captionVisible`. Always supply one for screen readers. */
  caption?: string;
  captionVisible?: boolean;
  className?: string;
};

const CELL_STYLE: React.CSSProperties = {
  paddingBlock: "var(--cell-pad-y)",
  paddingInline: "var(--cell-pad-x)",
};

export function FactTable({ rows, caption, captionVisible = false, className }: FactTableProps) {
  if (rows.length === 0) return null;

  return (
    <div
      className={["density-instrument w-full min-w-0 overflow-x-auto", className]
        .filter(Boolean)
        .join(" ")}
    >
      <table className="w-full border-collapse text-left">
        {caption ? (
          <caption
            className={captionVisible ? "micro-label text-left" : "sr-only"}
            style={captionVisible ? { ...CELL_STYLE, captionSide: "top" } : undefined}
          >
            {caption}
          </caption>
        ) : null}

        <tbody>
          {rows.map((row) => {
            const mono = row.mono ?? true;
            return (
              <tr key={row.key} className="hairline-b">
                <th
                  scope="row"
                  className="text-dim align-top text-left"
                  style={{ ...CELL_STYLE, fontWeight: 500, height: "var(--row-h)" }}
                >
                  {row.key}
                </th>
                <td
                  className={["align-top text-ink", mono ? "num num-cell" : "text-left"].join(" ")}
                  style={{ ...CELL_STYLE, height: "var(--row-h)", width: "50%" }}
                >
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
