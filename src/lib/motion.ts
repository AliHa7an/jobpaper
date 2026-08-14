"use client";

/**
 * Motion utilities shared by the interaction mechanics (Group B).
 *
 * The design system allows three durations and exactly one easing curve
 * (07-DESIGN-SYSTEM §3). CSS reads them from tokens; JS-driven animation
 * (M2 LiveNumber, M5 RankedRows, M6 LiveWarnings) cannot read a token that
 * collapses to 0ms, so it re-states the same numbers here and checks
 * `prefers-reduced-motion` itself — per DESIGN-CONTRACT rule 6.
 *
 * No dependencies. No React beyond the one subscription hook.
 */

import { useSyncExternalStore } from "react";

/** hover, focus, toggle */
export const DUR_FAST = 120;
/** panel open, step transition, value tween */
export const DUR_BASE = 200;
/** the one orchestrated moment per app: the Fork drawing */
export const DUR_SIGNATURE = 700;

/** The single easing curve. Mirrors `--ease: cubic-bezier(0.2, 0, 0.13, 1)`. */
export const EASE_CSS = "cubic-bezier(0.2, 0, 0.13, 1)";

const NEWTON_ITERATIONS = 5;

function bezierAt(t: number, a1: number, a2: number): number {
  const c = 3 * a1;
  const b = 3 * (a2 - a1) - c;
  const a = 1 - c - b;
  return ((a * t + b) * t + c) * t;
}

function bezierSlope(t: number, a1: number, a2: number): number {
  const c = 3 * a1;
  const b = 3 * (a2 - a1) - c;
  const a = 1 - c - b;
  return (3 * a * t + 2 * b) * t + c;
}

/**
 * A CSS-equivalent cubic-bezier easing function, solved with Newton-Raphson.
 * Both control curves used here are monotonic, so no bisection fallback is
 * needed; the result is clamped regardless.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (x: number) => number {
  return (x: number): number => {
    if (!(x > 0)) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < NEWTON_ITERATIONS; i++) {
      const slope = bezierSlope(t, x1, x2);
      if (slope === 0) break;
      t -= (bezierAt(t, x1, x2) - x) / slope;
    }
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return bezierAt(t, y1, y2);
  };
}

/** The system easing curve, as a JS function of progress 0→1. */
export const easeAtlas = cubicBezier(0.2, 0, 0.13, 1);

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Imperative check, for use inside effects and rAF loops.
 * Read at animation time — a user can flip the OS setting mid-session.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCE_QUERY).matches;
}

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Reactive form, for components that render differently (not just animate
 * differently) under reduced motion. Server snapshot is `false` so markup is
 * identical on both sides of hydration.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
}
