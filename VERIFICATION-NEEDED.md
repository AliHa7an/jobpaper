# VERIFICATION-NEEDED

Everything in this file blocks the removal of an on-screen warning. Nothing here is
verified; all of it ships flagged. Do not remove a flag without completing the
verification and logging it in `/changelog`.

## 1. Pricing data — ALL of it (placeholder)

Every unit cost, labor-hour figure, labor rate, waste factor, regional multiplier, and
range spread in `packages/engine/src/rules/trades/*.json` is **modelled placeholder
reference data** (marked "Aug 2026 placeholder" in each line-item basis). Required before
the placeholder flag comes off:

- [ ] Secure a licensed cost-data source (RSMeans-style) or equivalent public basis
      (BLS/prevailing-wage for labor, retailer pricing for commodity materials)
- [ ] Sanity check of all three launch trades by **two working contractors**
      (spec gate: estimates within ±20% of reference cost guides)
- [ ] Re-issue rules files with new `ruleSetVersion`, real `citations[]`, and
      `lastVerified` dates; add `/changelog` entry

## 2. State contract clause language — ALL five states (UNVERIFIED templates)

Every clause `text` in `packages/engine/src/rules/states/*.json` is placeholder template
language marked **"UNVERIFIED — ATTORNEY REVIEW REQUIRED"**. The statute cites below were
encoded from general knowledge, not primary-source verification. A construction attorney
must verify, per state:

### California (`ca.json`)
- [ ] Bus. & Prof. Code §7159 — threshold ($500), required contract contents, exact
      statutory notice wording (mechanics lien warning, CSLB notice, three-day/five-day
      cancellation)
- [ ] Down payment cap: lesser of $1,000 or 10% — §7159(d)(8) cite and current values
- [ ] Prohibited terms list; license display requirement

### Texas (`tx.json`)
- [ ] Homestead lien contract requirements — Prop. Code §53.254 (both spouses, filing)
- [ ] Home solicitation cancellation — Bus. & Com. Code ch. 601 scope and notice form
- [ ] Bills-paid affidavit — §53.259 and the $5,000 trigger used here (placeholder)
- [ ] Whether a statewide written-contract threshold exists (currently encoded as 0 / none)

### Florida (`fl.json`)
- [ ] §713.015 lien-law notice — exact mandatory ALL-CAPS text, $2,500 threshold, and
      whether it belongs at `total >= threshold` (currently $2,500)
- [ ] §489.1425 recovery fund notice — exact text and trigger amount
- [ ] §489.119(5) license number display

### New York (`ny.json`)
- [ ] GBL art. 36-A §771 — required contract terms and the correct cancellation cite
      (GBL vs. Pers. Prop. Law §428)
- [ ] Lien Law §71-a(4) escrow/bond requirement — exact obligations and wording
- [ ] Threshold currently encoded as $500 — verify (GBL §770 definition)
- [ ] NYC/county licensing vs. state — licenseDisplayRequired is encoded `true` statewide,
      which is likely wrong (licensing is county/city level in NY)

### Pennsylvania (`pa.json`)
- [ ] HICPA 73 P.S. §517.7 — contract contents, $500 scope, three-day rescission
- [ ] Down payment cap — one-third rule and the special-order-materials adjustment;
      current trigger `downpayment > 33%` is an approximation of "one-third"
- [ ] Registration display — §517.9 cite

## 3. Structural items

- [ ] Citation URLs in trade rules point at `example.invalid` placeholders — replace with
      the real pricing-source URLs when data lands
- [ ] `homeImprovementThresholdCents` values per state are provisional
- [ ] Trigger DSL coverage: verify each state's real statutory conditions are expressible
      (add trigger forms if an attorney identifies conditions the DSL can't express)
- [ ] Named credentialed reviewer (construction attorney) published on /about —
      portfolio invariant 8: no reviewer, no launch
