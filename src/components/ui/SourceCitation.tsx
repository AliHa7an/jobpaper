"use client";

import * as React from "react";
import { formatDate } from "@/lib/format";

/**
 * SourceCitation — an inline superscript link with a hover/focus detail.
 *
 * "Cite in-line, not in a footer." The citation's adjacency to the claim is
 * the E-E-A-T signal and is what makes the passage quotable-with-authority.
 *
 * Keyboard reachable because it IS a link — the superscript is the anchor, so
 * Tab reaches it, Enter follows it, and the detail opens on focus exactly as
 * it does on hover. Escape closes it. The detail is positioned absolutely so
 * revealing it can never move a line of text, and it flips its anchor edge
 * near the right of the viewport so it cannot push the page wide at 375px.
 *
 * The visible detail is aria-hidden; the same content is carried inside the
 * link as visually-hidden text, so a screen reader hears the source without
 * depending on a hover state ever firing.
 */

export type SourceCitationProps = {
  /** The superscript marker. 1-based, matching the page's source list. */
  index: number;
  /** "34 C.F.R. § 685.209(a)(2)" — the primary source, named precisely. */
  label: string;
  url: string;
  /** ISO date. Rendered "8 Aug 2026". */
  lastVerified: string;
  className?: string;
};

export function SourceCitation({
  index,
  label,
  url,
  lastVerified,
  className,
}: SourceCitationProps) {
  const [open, setOpen] = React.useState(false);
  const [alignEnd, setAlignEnd] = React.useState(false);
  const anchorRef = React.useRef<HTMLSpanElement | null>(null);
  const reactId = React.useId();
  const detailId = `cite-${reactId}`;

  const reveal = React.useCallback(() => {
    const node = anchorRef.current;
    if (node) {
      // Flip the panel's anchor edge when the marker sits in the right-hand
      // third of the viewport, so it opens inward instead of overflowing.
      const rect = node.getBoundingClientRect();
      setAlignEnd(rect.left > window.innerWidth * 0.6);
    }
    setOpen(true);
  }, []);

  const dismiss = React.useCallback(() => setOpen(false), []);

  return (
    <span
      ref={anchorRef}
      className={["relative inline", className].filter(Boolean).join(" ")}
      onMouseEnter={reveal}
      onMouseLeave={dismiss}
    >
      <sup>
        <a
          href={url}
          onFocus={reveal}
          onBlur={dismiss}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              event.stopPropagation();
              dismiss();
            }
          }}
          className="num rounded-atlas text-signal no-underline"
          style={{
            fontSize: "var(--text-step--2)",
            // A 44px touch target without a 44px box in the middle of a
            // sentence: the padding extends the hit area, the negative margin
            // keeps the line's metrics untouched.
            padding: "10px 4px",
            margin: "-10px -2px",
            borderRadius: "var(--radius-atlas)",
            fontWeight: 600,
          }}
        >
          <span aria-hidden="true">[{index}]</span>
          <span className="sr-only">
            {` Source ${index}: ${label}, verified ${formatDate(lastVerified)}`}
          </span>
        </a>
      </sup>

      {open ? (
        <span
          id={detailId}
          aria-hidden="true"
          className="hairline-all rounded-atlas absolute z-20 block text-left"
          style={{
            top: "calc(100% + 4px)",
            left: alignEnd ? "auto" : 0,
            right: alignEnd ? 0 : "auto",
            width: "max-content",
            maxWidth: "min(20rem, calc(100vw - 32px))",
            background: "var(--paper-raised)",
            borderRadius: "var(--radius-atlas)",
            padding: "8px 12px",
            fontSize: "var(--text-step--1)",
            lineHeight: 1.35,
            whiteSpace: "normal",
          }}
        >
          <span className="block text-ink" style={{ fontWeight: 600 }}>
            {label}
          </span>
          <span className="mt-1 block text-dim">
            Verified <span className="num">{formatDate(lastVerified)}</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
