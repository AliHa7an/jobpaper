"use client";

/**
 * M2 — values tween, so causality is visible.
 *
 * The figure counts from its old value to its new one over 200ms, driven by
 * `requestAnimationFrame` writing to the text node itself. Never a CSS
 * transition on a layout property: the point is that the *number* moves, not
 * that a box does. Because every figure is set in the tabular data face, the
 * glyph advance is constant and a counting value causes zero layout shift.
 *
 * Seeing the change propagate is what turns a form into a model.
 *
 * Under `prefers-reduced-motion: reduce` the value swaps instantly — checked
 * imperatively at animation time, per DESIGN-CONTRACT rule 6.
 */

import { useLayoutEffect, useRef } from "react";
import { DUR_BASE, easeAtlas, prefersReducedMotion } from "@/lib/motion";

export interface LiveNumberProps {
  /** The target value. Cents, basis points, months — whatever `format` reads. */
  value: number;
  /** Formats the tween's intermediate values too, so pass a total function. */
  format: (n: number) => string;
  /** Defaults to 200ms (`--dur-base`). */
  durationMs?: number;
  className?: string;
}

export function LiveNumber({
  value,
  format,
  durationMs = DUR_BASE,
  className,
}: LiveNumberProps) {
  const elRef = useRef<HTMLSpanElement | null>(null);
  /** The value currently painted — not necessarily the last target, if a
      change interrupts a tween mid-flight. Tweening from what the eye can see
      is the whole point. */
  const paintedRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  // Latest-ref so an inline `format` prop cannot re-trigger (and so abort) a
  // running tween on every parent render. Declared first, so it is up to date
  // before the tween effect below runs in the same commit.
  const formatRef = useRef(format);
  useLayoutEffect(() => {
    formatRef.current = format;
  });

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const from = paintedRef.current;
    const to = value;
    if (from === to) return;

    const settle = () => {
      paintedRef.current = to;
      el.textContent = formatRef.current(to);
    };

    if (
      durationMs <= 0 ||
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      prefersReducedMotion()
    ) {
      settle();
      return;
    }

    const started = performance.now();
    const span = to - from;

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      if (t >= 1) {
        rafRef.current = null;
        settle();
        return;
      }
      const current = from + span * easeAtlas(t);
      paintedRef.current = current;
      el.textContent = formatRef.current(current);
      rafRef.current = requestAnimationFrame(step);
    };

    // React has already painted the target string into this node. Put the
    // starting value back before the browser paints, so the tween begins where
    // the eye left off rather than flashing the answer and counting to it.
    el.textContent = formatRef.current(from);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, durationMs]);

  // Unmount guard: the effect above only cleans up its own generation.
  useLayoutEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <span ref={elRef} className={className ? `num ${className}` : "num"}>
      {format(value)}
    </span>
  );
}
