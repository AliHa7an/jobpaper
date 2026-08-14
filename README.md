# JobPaper

Trades estimate → invoice → contract engine. Describe the job, get an itemized estimate
on a live takeoff sheet, a matching invoice, and a contract template with the clauses
your state requires — free, no signup, no database.

**Quote it right. Paper it right. Get paid.**

## The placeholder-pricing caveat (read first)

All v1 pricing — unit costs, labor hours, labor rates, regional multipliers — is
**placeholder reference data**, labelled as such on every line item and flagged on every
estimate. State contract clause text is **UNVERIFIED template language** requiring
construction attorney review, and is marked that way in the data, in the UI, and on every
generated document. The full punch list is in [`VERIFICATION-NEEDED.md`](./VERIFICATION-NEEDED.md).
Framing everywhere: **template, not legal advice.**

## Structure

```
packages/engine/            Pure TypeScript. ZERO deps, zero AI, zero network.
  src/types.ts              Job, LineItem, Estimate (ranges), Invoice, contract types
  src/money.ts              Integer-cent arithmetic; ALL rounding rules documented here
  src/assemblies.ts         Job -> assemblies -> priced line items (deterministic DSL)
  src/estimate.ts           Σ lines + overhead% + profit% -> total + low–high range
  src/regional.ts           Regional multipliers (applied before pricing)
  src/contracts.ts          Deterministic clause selection from trigger expressions
  src/invoice.ts            Estimate -> invoice; totals match to the cent
  src/rules/trades/*.json   3 launch trades: decks, interior paint, bathroom remodel
                            (assemblies, grade tiers, labor formulas, waste, regions)
  src/rules/states/*.json   5 states: CA, TX, FL, NY, PA (required clauses w/ statutes,
                            thresholds, prohibited terms) — versioned + cited
  tests/                    44 Vitest tests: money, assemblies, estimates, regional,
                            clause triggers, invoice matching

src/app/                    Next.js 16.3.0 (App Router, pinned exact)
  page.tsx                  Home = job builder + the Takeoff Sheet (signature element)
  invoice/                  Matching invoice view (printable)
  contract/                 State contract view (clauses + statute cites)
  contracts/[state]/        Static requirement pages for the 5 launch states
  pricing-methodology/      Honest data-basis page (placeholder status included)
  sources/ editorial-policy/ changelog/ about/   Trust pages

scripts/check-engine-purity.sh   CI grep: no AI, no network, no external imports
```

Documents persist in `localStorage` only — no server-side storage, no accounts.
Printing uses a print stylesheet (the on-screen sheet **is** the document).

## Run

```bash
npm install
npm run dev            # http://localhost:3000
npm run typecheck      # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm test               # engine test suite (Vitest)
npm run check:engine   # engine purity grep (no AI / network / deps)
npm run build          # production build
npm run lint
```

## Engine invariants

- **Money is integer cents**, rates are basis points. Rounding: half away from zero, at
  the moment a value becomes money, documented in `money.ts`.
- **No AI anywhere in the calculation path** — enforced by `npm run check:engine`.
- **Rules live in versioned, cited JSON** with `effectiveFrom`/`effectiveTo`,
  `citations[]` + `lastVerified`. Estimates from rules past their stale window carry a
  visible flag.
- **Estimates are ranges, not points** ("$8,479–$11,117"), with per-line basis labels and
  pinned assumptions.
- **Clause selection is deterministic**: trigger expressions like
  `downpayment > min($1000, 10%)` are parsed and evaluated against job facts; unknown
  triggers throw rather than guess.

## v1 vs phase 2

**v1 (this repo):** structured job builder (3 trades × 5 job types), takeoff sheet with
live editing, invoice, state contract templates (5 states), state requirement pages,
trust pages, localStorage + print. No AI, no database, no auth, no payments.

**Phase 2 (not built):** free-text job description → line items (AI, behind a
non-skippable review screen) · photo → scope draft · PDF pipeline + unbranded-document
premium · e-sign · change orders · deposit/progress schedules with state caps enforced ·
more trades (HVAC, electrical, roofing, landscaping) + more states · community pricing
benchmarks from consented actuals.
