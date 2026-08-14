import * as React from "react";

/**
 * AnswerBox — the most important 60 words on the page.
 *
 * This is the passage an AI Overview lifts and the featured-snippet candidate,
 * so it is written to survive being excerpted with zero surrounding context.
 * Per the copy playbook:
 *
 *   • Answer first, qualify second. Never "There are many factors that…"
 *   • One concrete number minimum — numbers are what get quoted.
 *   • Self-contained: it must make sense alone.
 *   • Present tense, active voice, no brand mention. The citation link is
 *     where the brand travels; AI Overviews strip brands from lifted text.
 *   • One qualifier maximum ("under current 2026 rules"). Never hedge-stack.
 *
 * Treatment: a half-step of background and a --signal left rule. No card, no
 * shadow, no badge. It should read as the answer set apart, not as a callout
 * box decorating a page.
 *
 * Wrap every figure in <span className="num"> so the answer's numbers set in
 * the data face — they are the part that gets quoted.
 */

export type AnswerBoxProps = {
  children: React.ReactNode;
  /** Optional title. Rendered as <h2> — the display face is h1/h2 only. */
  heading?: string;
  className?: string;
};

const WORD_LIMIT = 60;

export function AnswerBox({ children, heading, className }: AnswerBoxProps) {
  if (process.env.NODE_ENV !== "production") {
    const words = countWords(children);
    if (words > WORD_LIMIT) {
      console.warn(
        `AnswerBox: ${words} words. The limit is ${WORD_LIMIT} — beyond it the ` +
          `passage stops being liftable as a featured snippet. Cut the qualifiers first.`,
      );
    }
  }

  return (
    <div
      className={["rounded-atlas", className].filter(Boolean).join(" ")}
      style={{
        borderRadius: "var(--radius-atlas)",
        borderLeft: "2px solid var(--signal)",
        background: "var(--paper-raised)",
        padding: "16px 24px",
      }}
    >
      {heading ? <h2 style={{ marginBottom: "8px" }}>{heading}</h2> : null}
      <div
        className="text-ink"
        style={{
          fontSize: "var(--text-step-1)",
          lineHeight: 1.5,
          maxWidth: "var(--measure)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Best-effort word count over the rendered text. Development-only guard rail —
 * it walks strings and numbers through arrays and element children, and simply
 * gives up on anything it cannot read rather than guessing.
 */
function countWords(node: React.ReactNode): number {
  return extractText(node).trim().split(/\s+/).filter(Boolean).length;
}

function extractText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return ` ${node} `;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return "";
}
