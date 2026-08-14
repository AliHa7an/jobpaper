/**
 * The design system — public surface.
 *
 * Authoritative specs: 07-DESIGN-SYSTEM.md (§4 components) and the interaction
 * spec (§2 the nine mechanics). Component APIs are frozen in Repayment Atlas's
 * DESIGN-CONTRACT.md, which this directory implements unchanged.
 *
 * PORTED, NOT REWRITTEN. Every component reads only the six semantic colour
 * tokens and the shared scale from globals.css, so lifting the directory into
 * this app and swapping the `@theme` block re-themed the whole system. Nothing
 * here knows about trades, estimates, or contracts.
 *
 * Dropped on the way in, because JobPaper has no surface that uses them:
 *   AdSlot          — no advertising in v1
 *   Checkbox        — every choice here is one-of-N, so RadioGroup/Select cover it
 *   ConfidenceMeter — the builder ships plausible defaults for every field, so
 *                     there is no incomplete-input state to report
 *   Dialog          — nothing in this product interrupts; traces expand in place
 *   MarginalProbe   — its contract requires the slider value and the derivative
 *                     to share one money unit. JobPaper's only useful
 *                     derivative is "$ per extra foot / per extra point", where
 *                     the level is feet or percent and the delta is dollars, so
 *                     the component cannot express it honestly. The margin
 *                     derivative ships as reactive copy (M8) instead.
 *   RankedRows      — nothing ranks or reorders
 *   ScenarioPins    — no compressed-URL scenario encoding in v1
 *   ScrubTrack      — no time axis; an estimate is a moment, not 30 years
 *   Stepper         — the job builder is one screen, not a stepped flow
 *   Tabs, Tooltip   — nothing needed either; the disclosure carries explanation
 */

/* ---- Group A: primitives ------------------------------------------------ */
export { Button } from "./Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./Button";
export { Field } from "./Field";
export { Input } from "./Input";
export { NumberInput } from "./NumberInput";
export type { NumberUnit } from "./NumberInput";
export { Select } from "./Select";
export { RadioGroup } from "./RadioGroup";
export { Disclosure } from "./Disclosure";

/* ---- Group B: the interaction mechanics in use here --------------------- */
export { LiveNumber } from "./LiveNumber"; // M2 values tween
export { LiveWarnings } from "./LiveWarnings"; // M6 warnings that live
export type { LiveWarning } from "./LiveWarnings";
export { TraceDisclosure } from "./TraceDisclosure"; // M9 traces on tap
// M8 (reactive copy) is not a component — it is a deterministic template.

/* ---- Group C: data display ---------------------------------------------- */
export { HeroNumber } from "./HeroNumber";
export { LedgerTable } from "./LedgerTable";
export type { LedgerColumn, LedgerRow } from "./LedgerTable";
export { WarningStack } from "./WarningStack";
export type { Warning } from "./WarningStack";
export { LastVerified } from "./LastVerified";
export { AnswerBox } from "./AnswerBox";
export { FactTable } from "./FactTable";
export type { FactRow } from "./FactTable";
export { SourceCitation } from "./SourceCitation";
export { SkeletonBlock, EmptyState, ErrorState } from "./States";
