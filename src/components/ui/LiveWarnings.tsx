"use client";

/**
 * M6 — warnings that live.
 *
 * Set a disbursement date past 1 Jul 2026 and "you're restricted to RAP"
 * arrives; change it back and it is gone. Users learn the rules by tripping
 * them safely, which only works if the feedback is exact:
 *
 *   • Entry is 200ms, opacity and a 2px settle. Never bouncy, never a spring —
 *     a warning is not a notification.
 *   • Exit is IMMEDIATE. A warning that lingers after it stops applying is a
 *     bug, not a flourish: for the moment it lingers it is a false statement
 *     about the reader's situation. There is therefore no exit transition and
 *     no leaving-item bookkeeping in this file, by design.
 *
 * The container is always mounted and always `aria-live="polite"`, so a
 * warning that appears is announced. `--flag` pairs with an icon and the word
 * "Irreversible" every time — colour is never the only carrier.
 *
 * Under `prefers-reduced-motion: reduce` warnings appear at full opacity in
 * the frame they apply. Identical information, no motion.
 */

import { useLayoutEffect, useRef } from "react";
import { DUR_BASE, EASE_CSS, prefersReducedMotion } from "@/lib/motion";

export type LiveWarningSeverity = "irreversible" | "caution";

export interface LiveWarning {
  id: string;
  severity: LiveWarningSeverity;
  title: string;
  /** One concrete sentence. Never "please review carefully". */
  body: string;
  /** Overrides the severity's own word. See WarningStack's `label`. */
  label?: string;
}

export interface LiveWarningsProps {
  warnings: LiveWarning[];
  className?: string;
}

function IrreversibleMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="11"
      height="11"
      viewBox="0 0 12 12"
      style={{ display: "inline-block", verticalAlign: "-1px" }}
    >
      <path
        d="M2.5 2.5l7 7M9.5 2.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
        fill="none"
      />
    </svg>
  );
}

function CautionMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="11"
      height="11"
      viewBox="0 0 12 12"
      style={{ display: "inline-block", verticalAlign: "-1px" }}
    >
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25" fill="none" />
      <path d="M6 3.25v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M6 8.5v.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

export function LiveWarnings({ warnings, className }: LiveWarningsProps) {
  const nodesRef = useRef<Map<string, HTMLLIElement>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<HTMLLIElement[]>([]);
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const present = new Set(warnings.map((w) => w.id));
    const reduce = prefersReducedMotion();
    const entering: HTMLLIElement[] = [];

    for (const [id, el] of nodesRef.current) {
      if (!present.has(id) || seenRef.current.has(id)) continue;
      seenRef.current.add(id);
      if (reduce) continue;
      el.style.opacity = "0";
      el.style.transform = "translateY(-2px)";
      entering.push(el);
    }

    // A warning that stops applying is forgotten, so that the same condition
    // tripped again reads as a new arrival rather than a silent reappearance.
    for (const id of seenRef.current) {
      if (!present.has(id)) seenRef.current.delete(id);
    }

    if (entering.length > 0) {
      // Queue rather than replace: an element parked at opacity 0 whose play
      // frame got cancelled would never become visible again.
      pendingRef.current.push(...entering);
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const batch = pendingRef.current;
          pendingRef.current = [];
          for (const el of batch) {
            el.style.transition = `opacity ${DUR_BASE}ms ${EASE_CSS}, transform ${DUR_BASE}ms ${EASE_CSS}`;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }
        });
      }
    }
  });

  useLayoutEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      pendingRef.current = [];
    };
  }, []);

  return (
    <ul aria-live="polite" className={className}>
      {warnings.map((warning) => {
        const irreversible = warning.severity === "irreversible";
        const accent = irreversible ? "var(--flag)" : "var(--dim)";
        return (
          <li
            key={warning.id}
            ref={(el) => {
              if (el) nodesRef.current.set(warning.id, el);
              else nodesRef.current.delete(warning.id);
            }}
            className="mt-3 py-1 pl-3 first:mt-0"
            style={{ borderLeft: `2px solid ${accent}` }}
          >
            <p className="micro-label flex items-center gap-1" style={{ color: accent }}>
              {irreversible ? <IrreversibleMark /> : <CautionMark />}
              {warning.label ?? (irreversible ? "Irreversible" : "Caution")}
            </p>
            <p
              className="font-medium"
              style={{
                color: irreversible ? "var(--flag)" : "var(--ink)",
                fontSize: "var(--text-step-0)",
              }}
            >
              {warning.title}
            </p>
            <p className="text-dim" style={{ fontSize: "var(--text-step--1)", lineHeight: 1.5 }}>
              {warning.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
