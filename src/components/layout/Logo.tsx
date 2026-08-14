/**
 * The logo lockup: mark + wordmark.
 *
 * The mark is the Takeoff Sheet at its smallest legible size — a ruled sheet on
 * a steel clipboard, three line items with their quantities in the left column,
 * and the total ruled off in safety blue at the foot. It is the same drawing as
 * the favicon (src/app/icon.svg) and the same idea as the signature element, so
 * the tab, the header and the product all argue the same thing.
 *
 * Drawn in var(--ink) / var(--paper) / var(--signal) rather than hex, so it
 * re-themes with the tokens instead of drifting away from them.
 *
 * The wordmark is set in the BODY face, not the display face. The system
 * confines --font-display to h1/h2, and a wordmark in it reads as a second
 * title competing with the page's real one. Weight and tight tracking carry
 * the identity instead.
 */

import Link from "next/link";

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
      style={{ borderRadius: "var(--radius-atlas)" }}
    >
      <rect width="32" height="32" rx="3" fill="var(--ink)" />
      {/* the sheet */}
      <rect x="6" y="4" width="20" height="24" rx="1.5" fill="var(--paper)" />
      {/* the quantity column rule */}
      <path d="M11.5 7v14" stroke="var(--ink)" strokeOpacity="0.22" strokeWidth="1.2" />
      {/* line items: qty on the left of the rule, description on the right */}
      <g
        stroke="var(--ink)"
        strokeOpacity="0.42"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M8.5 9h1.5M13.5 9h10" />
        <path d="M8.5 13h1.5M13.5 13h8" />
        <path d="M8.5 17h1.5M13.5 17h10" />
      </g>
      {/* the running total, ruled off */}
      <path d="M9 21.5h14" stroke="var(--signal)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14 24.5h9" stroke="var(--signal)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="rounded-atlas text-ink inline-flex min-h-11 items-center gap-2"
      aria-label="JobPaper — home"
    >
      <LogoMark />
      <span className="text-[1.0625rem] font-semibold tracking-[-0.015em]">JobPaper</span>
    </Link>
  );
}
