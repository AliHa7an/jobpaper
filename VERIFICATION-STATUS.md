# VERIFICATION-STATUS

Phase 1 verification pass against primary sources. This document records what the
encoded values *should* be, and — since the Batch A remediation below — which of
those corrections have actually landed in the rules files.

**Date of pass: 2026-08-15.**
**Batch A remediation applied: 2026-08-15.** See "Batch A remediation" immediately
below for what changed. Rows corrected in that batch are prefixed **FIXED**; rows
left alone are still **UNRESOLVED** and are listed together at the end.

## Summary

**49 items checked — 15 verified, 23 corrected, 11 unresolved.**

---

## Batch A remediation — what actually changed (2026-08-15)

The governing constraint has not changed: **the verbatim statutory text still could
not be obtained**, so none of it was written. The remediation makes the gap
*structural and blocking* instead of *papered over with a paraphrase*.

**1. Every required clause now declares a `textStatus`.**
`"DRAFTED"` (no wording prescribed — the encoded text may be drafted),
`"VERBATIM_REQUIRED_NOT_TRANSCRIBED"`, or
`"SUBSTANTIALLY_SIMILAR_REQUIRED_NOT_TRANSCRIBED"`. Any clause that is not
`DRAFTED` carries `"sourceUrl"` — the URL to transcribe from — and a `"formatting"`
object recording the statute's typography, placement and execution rules
(`minPointSize`, `boldface`, `capitalized`, `placement`,
`ownerSignatureAndDateRequired`, `copies`, `easilyDetachable`, plus free-text
`notes` for anything the fields cannot carry). The rules loader
(`packages/engine/src/rules/index.ts`) rejects a file where a non-`DRAFTED` clause
has no `sourceUrl`, or where it carries **any** text at all — a paraphrase in that
field is a paraphrase that gets rendered.

**2. Contract generation fails closed.** `selectClauses()` now calls
`assertContractGeneratable()` first and throws a typed `ContractBlockedError`
naming the state, every blocking clause id, its statute and its source URL. This
follows the engine's existing precedent of throwing on an unrecognised clause
trigger rather than guessing. Companion predicates `canGenerateContract(rules)` and
`untranscribedClauses(rules)` let the UI render the blocked state without catching a
throw. **The block is state-scoped, not fact-scoped:** a state with any
untranscribed clause produces no contract at any job size, because a rule that only
blocks the jobs it happens to fire on invites the workaround "make the job smaller".

**Current effect: CA, TX, FL and NY generate no contract. PA still generates** — it
is the one launch state where no provision prescribes wording.

**3. What is still missing after this batch.** Recording a formatting requirement is
not the same as being able to render it. Nothing downstream can yet set a per-clause
point size, produce a separate signed-and-dated notice page, or supply a detachable
duplicate form. Those remain blockers for CA, FL and TX **even once the text is
transcribed**.

---

Governing rule for this document: every row carries a URL that was **actually fetched
and returned content**, or it is marked UNRESOLVED. Nothing here is recalled or
inferred. Rows citing a non-government host are labelled **[SECONDARY]** and are a
cross-check only — they do not discharge the "cite or don't ship" invariant, and every
such row must be re-confirmed against the state's own site before any flag is cleared.

---

## THE HEADLINE FINDING: statutorily mandated verbatim text

**Yes — verbatim-mandated clause text was found, in four of the five states, and the
placeholders get all of it wrong.**

This is a materially worse situation than "unverified template language". Where a
statute prescribes exact wording, a paraphrase is not a weaker version of the clause —
it is a **non-compliant contract**, with consequences that in several of these states
run to lien invalidity, unenforceability of the contract, or a statutory cause of
action for the homeowner. The `UNVERIFIED — ATTORNEY REVIEW REQUIRED` prefix that used
to sit inside each `text` field did not mitigate this; it was *itself* inside the text
that would be rendered into a contract. **Batch A removed the text from every row in
this table**, rather than relabelling it — see the Status column.

| State | Provision | Mandated form | What the placeholder did | Status after Batch A |
|---|---|---|---|---|
| **CA** | B&P §7159(e)(4) mechanics lien warning | Verbatim | Truncated paraphrase | **FIXED (structurally)** — paraphrase deleted; clause `mechanics-lien-warning` is `VERBATIM_REQUIRED_NOT_TRANSCRIBED`, cite corrected from `§7159(e)` to `§7159(e)(4)`. Text still **UNRESOLVED**. |
| **CA** | B&P §7159(e)(6)(B)(i) three-day right to cancel | Verbatim, **12-point boldface** | Paraphrase, with the senior-citizen five-day window wrongly merged in | **FIXED (structurally)** — paraphrase deleted; `formatting.minPointSize: 12`, `boldface: true`; cite corrected to `§7159(e)(6)(B)(i)`; the senior variant is noted as a distinct, unmodelled notice. Text still **UNRESOLVED**. |
| **CA** | B&P §7159(e)(5) CSLB notice | Verbatim, **12-point typeface** | Paraphrase incl. a hard-coded PO Box | **FIXED (structurally)** — paraphrase and PO Box deleted; `formatting.minPointSize: 12` (no boldface required); cite corrected to `§7159(e)(5)`. Text still **UNRESOLVED**. |
| **CA** | B&P §7159(d)(8) down payment sentence | Verbatim, **12-point boldface** | Rewritten as prose | **FIXED (structurally)** — prose deleted; `formatting` records 12-point boldface capitalised. The down-payment *rule* (lesser of $1,000 or 10%) was verified correct and is unchanged. Text still **UNRESOLVED**. |
| **FL** | §713.015(1) construction lien notice | Verbatim, **12-point capitalized boldface**, front page or separate signed & dated page | **Truncated** — omitted the closing paragraphs | **FIXED (structurally)** — truncated text deleted; `formatting` records 12-point, capitalised, boldface, placement and `ownerSignatureAndDateRequired`; cite tightened to `§713.015(1)`. Text still **UNRESOLVED**. |
| **TX** | Bus. & Com. §601.052 cancellation statement | Verbatim, **10-point boldface minimum**, near the signature space | Wrapped in an added conditional preamble; "buyer" changed to "consumer" | **FIXED (structurally)** — altered text deleted; `formatting` records 10-point boldface and placement. Text still **UNRESOLVED**. The §601.052 receipt-delivery duty remains unmodelled. |
| **TX** | Bus. & Com. §601.053 Notice of Cancellation form | Verbatim, **10-point boldface**, **in duplicate**, **easily detachable** | **Absent entirely** | **FIXED (structurally)** — clause `notice-of-cancellation-form` added, with `copies: 2` and `easilyDetachable: true`. Text still **UNRESOLVED**, and nothing can yet *produce* a detachable duplicate. |
| **TX** | Prop. Code §53.255 disclosure statement | "**Substantially similar**" — substantial compliance suffices | **Absent entirely** | **FIXED (structurally)** — clause `residential-construction-disclosure-statement` added as `SUBSTANTIALLY_SIMILAR_REQUIRED_NOT_TRANSCRIBED`. Form still **UNRESOLVED**. |
| **NY** | GBL §771(1)(d) mechanic's lien notice | Prescribed text in "clear and conspicuous **bold face type**" | **Absent entirely** | **FIXED (structurally)** — clause `mechanics-lien-notice` added with `formatting.boldface: true`. Text still **UNRESOLVED**. |

The three that were **missing clauses** rather than merely wrong ones — TX §601.053,
TX §53.255 and NY §771(1)(d) — now exist as first-class entries. **None of the nine
has usable text.** Because the engine fails closed, CA, TX, FL and NY generate no
contract at all until each row above is transcribed.

**Deliberate omission from this document:** the exact statutory wording is *not*
reproduced here. The fetch tool available in this environment caps direct quotation at
125 characters, so no complete verbatim notice could be captured, and writing one out
from recall is precisely the failure mode this pass exists to prevent. Each notice must
be transcribed character-for-character from the statute URL in its row. Do not
reconstruct them.

---

## Sources that were unreachable from this environment

| Host | Failure | Affects |
|---|---|---|
| `statutes.capitol.texas.gov` | DNS — `getaddrinfo ENOTFOUND` | All TX citations |
| `capitol.texas.gov` | DNS — `getaddrinfo ENOTFOUND` | All TX citations |
| `www.flsenate.gov`, `flsenate.gov` | DNS — `getaddrinfo ENOTFOUND` | All FL citations |
| `www.leg.state.fl.us` | `ECONNREFUSED` | All FL citations |
| `www.legis.state.pa.us` | `ECONNREFUSED` | PA HICPA |
| `www.attorneygeneral.gov` | HTTP 403 (official Act 132 PDF) | PA HICPA |
| `law.justia.com` | HTTP 403 | cross-checks |
| `www.bls.gov` | HTTP 403 bot-block (all paths, WebFetch and curl with browser UA) | all labour-rate anchoring |

`leginfo.legislature.ca.gov` and `www.nysenate.gov` both worked — **CA and NY are
verified against the states' own sites.** TX, FL and PA are verified only against
`texas.public.law` and `codes.findlaw.com` **[SECONDARY]** and must be re-confirmed.

---

## California — `packages/engine/src/rules/states/ca.json`

| Item | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Statute citation URL | leginfo §7159 deep link | ca.json:10 | **VERIFIED** | `https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7159` | 2026-08-15 | Official state source, resolves to §7159. |
| `homeImprovementThresholdCents` | `50000` ($500) | ca.json:19 | **VERIFIED** — $500 | same as above | 2026-08-15 | Statute: written contract required where the aggregate price "**exceeds** five hundred dollars ($500)". The trigger `total >= threshold` (ca.json:25) is therefore off by one — should be strictly greater than. |
| `written-contract` clause text | placeholder paraphrase | ca.json:24 | **CORRECTED** | same as above | 2026-08-15 | §7159(d) enumerates **13** required elements; the placeholder covers roughly two. Cite `§7159(c)` at ca.json:26 is for the writing requirement, but the contents obligation is `(d)`. |
| `right-to-cancel` clause text | placeholder paraphrase | ca.json | **FIXED (structurally) — TEXT STILL UNRESOLVED** | same as above | 2026-08-15 | §7159(e)(6)(B)(i), required in **at least 12-point boldface type**. Transcribe exactly. Note the placeholder's "(five business days if you are 65 or older)" belongs to the senior-citizen variant and must not be merged into the standard notice text. |
| Down payment cap rule | lesser of $1,000 or 10% | ca.json:39 | **VERIFIED** | same as above | 2026-08-15 | §7159(d)(8) confirmed. The rule as encoded is correct. |
| `downpayment-cap` clause text | prose paraphrase | ca.json | **FIXED (structurally) — TEXT STILL UNRESOLVED** | same as above | 2026-08-15 | The statute prescribes a single capitalised sentence in **at least 12-point boldface type**, not the multi-sentence prose currently encoded. Transcribe exactly from §7159(d)(8). |
| `mechanics-lien-warning` clause text | truncated paraphrase | ca.json | **FIXED (structurally) — TEXT STILL UNRESOLVED** | same as above | 2026-08-15 | §7159(e)(4). The full statutory warning continues past the placeholder's stopping point into prescribed language on preliminary notices and joint checks. Transcribe exactly. |
| `cslb-notice` clause text | paraphrase incl. a mailing address | ca.json | **FIXED (structurally) — TEXT STILL UNRESOLVED** | same as above | 2026-08-15 | §7159(e)(5), required in **at least 12-point typeface**. Cite at ca.json:54 says `(e)` — should be `(e)(5)`. Do not carry the hard-coded PO Box forward without confirming it against the current statutory text. |
| `licenseDisplay` (was `licenseDisplayRequired`) | `true` | ca.json | **VERIFIED — FIXED (cite added)** | `https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7030.5` | 2026-08-15 | §7030.5: "Every person licensed pursuant to this chapter shall include his license number in: (a) all construction contracts; (b) subcontracts and calls for bid; and (c) all forms of advertising". Add §7030.5 to `citations[]` — it is the actual authority for this flag, and is not currently cited. |

---

## Texas — `packages/engine/src/rules/states/tx.json`

| Item | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Statute citation URLs | `statutes.capitol.texas.gov` | tx.json:10, 15 | **UNRESOLVED** | — | 2026-08-15 | Host DNS-unreachable. URLs not confirmed to resolve. Content below verified only via **[SECONDARY]** `texas.public.law`. |
| `homeImprovementThresholdCents` | `0` (no threshold) | tx.json:19 | **VERIFIED** | `https://texas.public.law/statutes/tex._prop._code_section_53.254` **[SECONDARY]** | 2026-08-15 | §53.254 imposes no dollar threshold. No statewide written-contract threshold found. Encoding 0 is right. |
| `homestead-lien-notice` substance | both spouses, before work, filed with county clerk | tx.json:24, 26 | **VERIFIED** | same as above | 2026-08-15 | §53.254(a)–(e) confirmed: written contract; executed **before** material furnished or labour performed; **both spouses** sign if the owner is married; **filed with the county clerk** of the county where the homestead is located. Placeholder text is a fair paraphrase and §53.254 does not prescribe *this* notice verbatim — but see the next row. |
| §53.255 Disclosure Statement | **absent** | tx.json | **FIXED (clause added) — FORM TEXT STILL UNRESOLVED** | `https://texas.public.law/statutes/tex._prop._code_section_53.255` **[SECONDARY]** | 2026-08-15 | A "Disclosure Statement for Residential Construction Contract" is required and the statute prescribes a form that "**must read substantially similar to** the following" — so, unusually, substantial compliance suffices here rather than verbatim. It opens "KNOW YOUR RIGHTS AND RESPONSIBILITIES UNDER THE LAW." and includes the headed sections GET IT IN WRITING and READ BEFORE YOU SIGN. **No such clause exists in `tx.json`.** |
| `right-to-cancel-solicitation` clause text | conditional paraphrase | tx.json | **FIXED (structurally) — TEXT STILL UNRESOLVED** | `https://texas.public.law/statutes/tex._bus._and_com._code_section_601.052` **[SECONDARY]** | 2026-08-15 | §601.052 prescribes the statement in **boldfaced type of at least 10 points**, positioned near the signature space or on the front of the receipt. The placeholder embeds the mandated sentence inside an added conditional ("If this transaction was solicited or agreed to at your residence…") and changes "the buyer" to "the consumer" — both alter prescribed text. Note also the statute requires the merchant to *deliver a receipt or contract copy* showing the transaction date and the merchant's name and address; the rules file does not model that. |
| §601.053 Notice of Cancellation form | **absent** | tx.json | **FIXED (clause added) — TEXT STILL UNRESOLVED** | `https://texas.public.law/statutes/tex._bus._and_com._code_section_601.053` **[SECONDARY]** | 2026-08-15 | A separate **Notice of Cancellation** form is required: verbatim wording, **10-point boldface**, supplied **in duplicate** and **easily detachable**. It covers the three-business-day window, return of traded-in property/payments within 10 business days, cancellation of security interests, the consumer's duty to make goods available, and the 20-day abandonment rule. **Entirely absent from `tx.json`**, and the §601.052 clause the file *does* have explicitly cross-references it ("See the attached notice of cancellation form"), so the generated contract currently points at a document it never produces. |
| `final-bills-paid-affidavit` trigger | `total > $5,000` | tx.json | **FIXED** — trigger is now `always`; no dollar threshold exists | `https://texas.public.law/statutes/tex._prop._code_section_53.259` **[SECONDARY]** | 2026-08-15 | §53.259(a) applies "As a condition of final payment under a residential construction contract" with **no monetary floor**. The $5,000 trigger (flagged as a placeholder in VERIFICATION-NEEDED) suppresses a required clause on every contract under $5,000. Also unencoded: §53.259(c) makes a false affidavit a misdemeanour (fine up to $4,000 and/or up to one year), and (d) imposes personal liability on the signer. |
| `disclosure-no-general-license` | "Texas does not license general residential construction contractors statewide" | tx.json:38, 40 | **UNRESOLVED** | — | 2026-08-15 | This is a substantive legal assertion cited only to "Tex. Occ. Code (trade-specific chapters)" — not a section. Nothing fetched confirms it. Either cite a specific provision or remove the clause; an uncited negative statement about licensing law should not ship. |
| `licenseDisplayRequired` | `false` | tx.json:50 | **VERIFIED** | `https://texas.public.law/statutes/tex._prop._code_section_53.254` **[SECONDARY]** | 2026-08-15 | Consistent with the absence of any display requirement in ch. 53 or ch. 601. Verified by absence, which is weaker than a positive cite — re-confirm when the official host is reachable. |

---

## Florida — `packages/engine/src/rules/states/fl.json`

| Item | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Statute citation URLs | `flsenate.gov/Laws/Statutes/2025/...` | fl.json:10, 15 | **UNRESOLVED** | — | 2026-08-15 | `flsenate.gov` DNS-unreachable and `leg.state.fl.us` refuses connections. URLs not confirmed to resolve. Content below verified only via **[SECONDARY]** `codes.findlaw.com`. |
| `homeImprovementThresholdCents` | `250000` ($2,500) | fl.json:19 | **VERIFIED** — $2,500, and it is the correct trigger for **both** notices | `https://codes.findlaw.com/fl/title-xl-real-and-personal-property/fl-st-sect-713-015/` and `https://codes.findlaw.com/fl/title-xxxii-regulation-of-professions-and-occupations/fl-st-sect-489-1425/` **[SECONDARY]** | 2026-08-15 | §713.015 applies to direct contracts over $2,500 for improvements to residential real property of up to four units. §489.1425 does not apply where "the value of all labor and materials does not exceed $2,500". |
| `lien-law-notice` clause text | truncated all-caps block | fl.json | **FIXED (structurally) — TEXT STILL UNRESOLVED** | `https://codes.findlaw.com/fl/title-xl-real-and-personal-property/fl-st-sect-713-015/` **[SECONDARY]** | 2026-08-15 | The statute requires the notice "printed in no less than **12-point, capitalized, boldfaced type** on the front page of the contract or on a separate page, **signed by the owner and dated**". It does **not** use "substantially in the following form" — the wording is prescribed. The encoded text stops after the "…EVEN IF YOU HAVE ALREADY PAID YOUR CONTRACTOR IN FULL." paragraph; the statutory notice continues past that point with further prescribed paragraphs. **Two further gaps:** the rules file has no way to express "front page or separate page" placement, and no way to require the owner's signature and date on the notice itself. |
| `lien-law-notice` trigger | `total >= threshold` | fl.json:25 | **CORRECTED** → strictly greater than $2,500 | same as above | 2026-08-15 | Statute says contracts "over" / "greater than" $2,500. A contract at exactly $2,500 currently fires the notice and should not. |
| `recovery-fund-notice` clause text | paraphrase | fl.json:31 | **CORRECTED** | `https://codes.findlaw.com/fl/title-xxxii-regulation-of-professions-and-occupations/fl-st-sect-489-1425/` **[SECONDARY]** | 2026-08-15 | §489.1425 requires the contract to "contain a written statement" explaining recovery-fund rights, and the CILB contact information is "as established by board rule" — i.e. the address is set by rule and must be pulled from the current board rule, not hard-coded from a template. Confirm whether the statute prescribes the wording verbatim or requires only substance; that distinction could not be resolved from the secondary source. |
| `recovery-fund-notice` trigger | `total > $2,500` | fl.json:32 | **VERIFIED** | same as above | 2026-08-15 | Correctly strict. Note this is inconsistent with the `>=` used on the lien notice two clauses above, for the same dollar figure. |
| `license-number` clause text | "on the first page of this contract and in all advertising" | fl.json:38 | **CORRECTED** | `https://codes.findlaw.com/fl/title-xxxii-regulation-of-professions-and-occupations/fl-st-sect-489-119/` **[SECONDARY]** | 2026-08-15 | §489.119(5) requires the number in "each offer of services, business proposal, bid, contract, or advertisement, regardless of medium" — **not** specifically the first page. It also requires the number on each building permit application and permit, and conspicuous display on vehicles bearing the contractor's name or artwork. "Advertisement" excludes business stationery and promotional items. |
| `licenseDisplayRequired` | `true` | fl.json:43 | **VERIFIED** | same as above | 2026-08-15 | Confirmed by §489.119(5). |

---

## New York — `packages/engine/src/rules/states/ny.json`

| Item | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Statute citation URLs | nysenate GBS/771, LIE/71-A | ny.json:10, 15 | **VERIFIED** | `https://www.nysenate.gov/legislation/laws/GBS/771` and `https://www.nysenate.gov/legislation/laws/LIE/71-A` | 2026-08-15 | Both resolve to the cited sections on the state's own site. Add GBL §770 — it is the source of the threshold and is not currently cited. |
| `homeImprovementThresholdCents` | `50000` ($500) | ny.json:19 | **VERIFIED** — $500 | `https://www.nysenate.gov/legislation/laws/GBS/770` | 2026-08-15 | §770 defines a home improvement contract as one where the aggregate price "**exceeds** five hundred dollars". Trigger `total >= threshold` (ny.json:25) is off by one. Separately, §770 defines a "home improvement contractor" by reference to $1,500 of aggregate business over 12 months — a different test the rules file does not model. |
| `written-contract-terms` clause text | 5 elements | ny.json:24 | **CORRECTED** — §771(1) requires more | `https://www.nysenate.gov/legislation/laws/GBS/771` | 2026-08-15 | Missing from the placeholder: the contractor's **licence number "if applicable"** (a); a statement of **any contingencies** affecting the dates and whether the completion date is essential (b); make/model or other identifying information for materials (c); and the **property and casualty insurance disclosure** including insurer contact details, added effective 23 April 2022 (i). |
| §771(1)(d) mechanic's lien notice | **absent** | ny.json | **FIXED (clause added) — TEXT STILL UNRESOLVED** | same as above | 2026-08-15 | §771(1)(d) prescribes a mechanic's lien notice in "**clear and conspicuous bold face type**", covering: that an unpaid contractor, subcontractor or materialman may have a valid claim known as a mechanic's lien; that such a lien may be discharged; that payment of the agreed price before filing may invalidate the lien; and that the owner may contact an attorney. **`ny.json` has no lien clause of any kind** — a generated NY contract omits it entirely. Transcribe the exact text from the URL above. |
| `right-to-cancel` cite | "§771(1)(g); Pers. Prop. Law §428" | ny.json:33 | **CORRECTED** | same as above | 2026-08-15 | The cancellation provision is at **§771(1)(h)**, not (1)(g) — (1)(g) is the time-and-materials carve-out from the deposit rules. The substance of the placeholder text is right (midnight of the third business day after signing). Unencoded: the statutory **bona fide emergency exception**, which requires the owner's signed, handwritten waiver statement. The `Pers. Prop. Law §428` cross-cite was **not verified** — resolve or drop it. |
| `deposit-escrow` clause text | escrow in 5 business days, or bond / contract of indemnity | ny.json:38 | **CORRECTED** — incomplete | `https://www.nysenate.gov/legislation/laws/LIE/71-A` | 2026-08-15 | Lien Law §71-a(4) confirmed: deposit "within **five business days**"; written notice of the depository location within **ten business days**. But the placeholder omits the third alternative — an **irrevocable letter of credit issued by a bank** — and omits that the bond/indemnity/letter-of-credit alternative must be delivered **within ten business days** of receiving payment. Also unencoded: withdrawals may not exceed the contract payment schedule, the funds remain the owner's property, and failure to escrow is itself a violation of the section. **No verbatim wording is prescribed by §71-a(4)** — this clause may be drafted, unlike the §771(1)(d) notice. |
| `progress-payment-schedule` cite | "§771(1)(d)" | ny.json:47 | **CORRECTED** | `https://www.nysenate.gov/legislation/laws/GBS/771` | 2026-08-15 | (1)(d) is the mechanic's lien notice. The progress-payment schedule — dollar amounts and the state of completion before each payment falls due, bearing a reasonable relationship to work performed — sits at **§771(1)(f)**, with the deposit obligation at (1)(e) and the time-and-materials exemption at (1)(g). The current cite points at an entirely different requirement. |
| `licenseDisplay` (was `licenseDisplayRequired`) | `true` (statewide) | ny.json | **FIXED → jurisdiction-scoped, `statewide: false`** | same as above | 2026-08-15 | **The suspicion in VERIFICATION-NEEDED is confirmed from the statute itself.** §771(1)(a) requires "The name, address, telephone number and license number, **if applicable**, of the contractor." The words "if applicable" are decisive: New York has no universal state contractor licence, so no statewide display duty can be asserted. Licensing is county/municipal (NYC and the surrounding counties operate their own regimes). A single boolean cannot express this — the field needs to become jurisdiction-scoped, defaulting to `false` at state level. Shipping `true` tells every upstate contractor to print a licence number that does not exist. |

---

## Pennsylvania — `packages/engine/src/rules/states/pa.json`

| Item | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Statute citation URL | PA AG consumer page (not the statute) | pa.json:10 | **UNRESOLVED** | — | 2026-08-15 | `attorneygeneral.gov` returns 403 (including its official Act 132 PDF) and `legis.state.pa.us` refuses connections. Note the encoded URL points at a consumer-information page, not the statute — it would not satisfy the citation invariant even if reachable. Content below verified only via **[SECONDARY]** `codes.findlaw.com`. |
| `homeImprovementThresholdCents` | `50000` ($500) | pa.json:14 | **VERIFIED as to value — WRONG CITE** | `https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-2/` **[SECONDARY]** | 2026-08-15 | The $500 floor lives in the **§517.2 definition** of "home improvement" ("the total cash price of all work agreed upon … is more than $500"), **not** in §517.7. The clause at pa.json:19–21 asserts the $500 threshold and cites §517.7(a), which does not contain it. |
| `hicpa-contract-contents` clause text | 6 elements, "for contracts over $500" | pa.json:19, 21 | **CORRECTED** | `https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-7/` **[SECONDARY]** | 2026-08-15 | §517.7(a) contains **no dollar threshold** (that is §517.2) and requires more than the placeholder lists: the transaction date, the contractor's **liability insurance amounts**, **subcontractor information**, a **toll-free number**, and the **notice of the right of rescission**. No verbatim wording is prescribed for this clause. |
| `rescission-right` clause text | 3 business days | pa.json:26, 28 | **VERIFIED** | same as above | 2026-08-15 | §517.7(b): an individual "shall be permitted to rescind the contract without penalty **regardless of where the contract was signed**, within three business days of the date of signing." **No verbatim notice wording is prescribed**, so this clause may be drafted. The placeholder's "except as otherwise provided by law for emergency work" carve-out was **not** confirmed in §517.7 — verify or remove it. The `total > $500` trigger at pa.json:27 is correct in substance via §517.2. |
| `downpayment-cap` statute cite | `73 P.S. §517.7(e)` | pa.json | **FIXED → §517.9** | `https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-7/` and `https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-9/` **[SECONDARY]** | 2026-08-15 | **§517.7 contains no down payment limit at all** — §517.7(a)(9) merely requires that the down payment and the cost of special-order materials be *disclosed and listed separately*. The actual prohibition is in **§517.9** (prohibited acts). The encoded cite points at a subsection that does not say what the clause claims. |
| `downpayment-cap` trigger | `downpayment > 33%` | pa.json | **FIXED** → `total > $5,000 and downpayment > 1/3 + specialOrderMaterials` | `https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-9/` **[SECONDARY]** | 2026-08-15 | §517.9 prohibits, for contracts with a total price of **more than $5,000**, receiving a deposit in excess of "(A) one-third of the home improvement contract price; or (B) one-third of the home improvement contract price **plus the cost of special order materials**." So the encoded trigger fails in **both directions**: it fires false positives on contracts of $5,000 or less (where no cap applies), and false negatives are impossible but *false alarms* are certain on any job with special-order materials, where the lawful ceiling is above one-third. The clause text at pa.json:33 already describes the $5,000 gate and the materials addition correctly — **the prose and the machine-readable trigger disagree with each other.** Also note "33%" is not "one-third"; use exact thirds arithmetic, not a basis-point approximation. |
| `registration-number` statute cite | `73 P.S. §517.9` | pa.json | **FIXED → §517.7(a)(1)**; advertising half STILL UNRESOLVED | same as above | 2026-08-15 | §517.9 is the prohibited-acts section; it requires registration (§517.9(1) penalises failure to register) but **does not require display of the registration number**. The in-contract requirement is **§517.7(a)(1)**. The advertising-display requirement asserted by the clause text is **UNRESOLVED** — no fetched source supports it. Either locate the provision or drop the advertising half of the sentence. |
| `licenseDisplay` (was `licenseDisplayRequired`) | `true` | pa.json | **VERIFIED — FIXED (cite corrected to §517.7(a)(1))** | `https://codes.findlaw.com/pa/title-73-ps-trade-and-commerce/pa-st-sect-73-517-7/` **[SECONDARY]** | 2026-08-15 | §517.7(a) lists the contractor registration number among required contract contents, so `true` is right for contract display. Update `citations[]` accordingly. |

---

## Pricing data — `packages/engine/src/rules/trades/*.json`

**Per the task scope, individual prices were not checked against retail sites.** Retail
listings are not a primary source and are too volatile to cite. The entire pricing
dataset is recorded as **UNRESOLVED — commercially licensed data pending**.

| Item | Current value | File:line | Correct value (or UNRESOLVED) | Source URL actually fetched | Date checked | Notes |
|---|---|---|---|---|---|---|
| Pricing citation URL | `https://example.invalid/pricing-methodology` | decks.json:11; interior-paint.json:11; bathroom-remodel.json:11 | **UNRESOLVED** | — | 2026-08-15 | Deliberate placeholder host. `.invalid` is a reserved TLD and will never resolve. Must be replaced when a licensed source lands. |
| `laborRateCentsPerHour` | `6200` (decks) | decks.json:16 | **UNRESOLVED** | — | 2026-08-15 | "$62/hr carpentry, Aug 2026 placeholder". Authoritative basis would be BLS OEWS 47-2031 Carpenters, loaded per region. |
| `laborRateCentsPerHour` | `5500` (interior paint) | interior-paint.json:16 | **UNRESOLVED** | — | 2026-08-15 | Authoritative basis: BLS OEWS 47-2141 Painters, Construction and Maintenance. |
| `laborRateCentsPerHour` | `6800` (bathroom remodel) | bathroom-remodel.json:16 | **UNRESOLVED** | — | 2026-08-15 | A "blended remodel-trades rate" has no single OEWS analogue; it would need to be built from a weighted basket (47-2031 Carpenters, 47-2152 Plumbers, 47-2111 Electricians, 47-2044 Tile and Stone Setters) with the weights documented. |
| `regionalMultipliersBps` | 9000–12500 across 6 regions | decks.json:23–30; interior-paint.json:23–30; bathroom-remodel.json:23–30 | **UNRESOLVED** | — | 2026-08-15 | **Identical values in all three trades**, which is itself a tell that they are modelled rather than measured — regional cost spread differs by trade. Authoritative basis: OEWS state and metro wage data for the labour component, plus a licensed city-cost-index for materials. |
| `accessLaborMultipliersBps`, `rangeBps`, `taughtDefaults` | various | decks.json:18–22, 31–32; interior-paint.json:18–22, 31–32; bathroom-remodel.json:18–22, 31–32 | **UNRESOLVED** | — | 2026-08-15 | Access multipliers, range spreads, and the overhead/profit defaults are judgement parameters with no public authoritative source. These are the items the **two-working-contractor sanity check** in VERIFICATION-NEEDED exists to validate; they will never be citable and should be labelled as taught defaults rather than sourced data. |
| All assembly unit costs and labour hours | every `assemblies[]` entry | decks.json:33–160; interior-paint.json:33–148; bathroom-remodel.json:33–138 | **UNRESOLVED** | — | 2026-08-15 | All marked "Aug 2026 placeholder" in each line-item basis. `staleAfterDays: 120` from `effectiveFrom: 2026-08-01` means this data is **already past its own staleness window as of this pass** — confirm the staleness flag is actually firing in the UI. |

### What an authoritative pricing basis would be

**Materials and assemblies — commercially licensed cost databases.** No free primary
source exists at the required granularity; this is a purchase, not a research task.

- **RSMeans** (Gordian) — the reference standard for unit costs, crew composition,
  labour-hours per assembly, and city cost indexes: `https://www.rsmeans.com/`
- **Craftsman National Construction Estimator** — a lower-cost alternative with a
  published annual edition: `https://www.craftsman-book.com/`

Both are licensed products. Their figures may not be redistributed as raw data, which
constrains what can be exposed through the engine — resolve the licensing question
**before** building an ingestion path.

**Labour — BLS Occupational Employment and Wage Statistics (OEWS).** This is the
authoritative public basis for regional labour rates, and it is free and citable:

- OEWS home: `https://www.bls.gov/oes/`
- National occupational estimates: `https://www.bls.gov/oes/current/oes_nat.htm`
- State and metro tables: `https://www.bls.gov/oes/tables.htm`
- Relevant SOC codes: **47-2031** Carpenters · **47-2141** Painters, Construction and
  Maintenance · **47-2152** Plumbers, Pipefitters and Steamfitters · **47-2111**
  Electricians · **47-2044** Tile and Stone Setters · **47-2061** Construction Laborers

**No BLS wage figures were captured in this pass.** `www.bls.gov` returned **HTTP 403**
on every path attempted, via both the fetch tool and curl with a browser user-agent —
the site is bot-blocking this environment. No OEWS median or mean hourly wage is
recorded here, because recording one without having fetched it is exactly the failure
this pass exists to prevent. Retrieve from a different network, or via the BLS public
API with verified series IDs, and note that OEWS is a **May-reference annual series** —
the release year must be recorded alongside every figure.

**A caution on using OEWS directly as `laborRateCentsPerHour`:** OEWS reports *employee
wages*, not *billable contractor rates*. The gap between them (payroll burden,
insurance, overhead, profit) is a multiplier the engine currently folds into
`taughtDefaults` — document that relationship explicitly when the real data lands, or
the labour side will be wrong by a large and consistent factor while looking rigorously
sourced.

---

## Still UNRESOLVED after Batch A

Nothing below was touched. Listed together so the remaining surface is visible in one
place.

| # | Item | Where | Why it is still open |
|---|---|---|---|
| 1 | All nine prescribed notice texts | CA ×4, FL ×1, TX ×3, NY ×1 | The wording itself. The fetch tool caps direct quotation at ~125 characters and the TX/FL legislature hosts are unreachable. Transcribe character-for-character from each clause's `sourceUrl`. |
| 2 | Rendering statutory typography and placement | contract surfaces | `formatting` is now *recorded* but nothing sets per-clause point size, produces a separate signed-and-dated notice page, or supplies a detachable duplicate. Blocks CA, FL and TX even after transcription. |
| 3 | TX citation URLs | tx.json | `statutes.capitol.texas.gov` DNS-unreachable. Encoded URLs unconfirmed; content verified only via `texas.public.law` **[SECONDARY]**. |
| 4 | FL citation URLs | fl.json | `flsenate.gov` DNS-unreachable, `leg.state.fl.us` refuses connections. Verified only via `codes.findlaw.com` **[SECONDARY]**. |
| 5 | PA citation URL | pa.json | Points at a PA AG consumer page, not the statute, and returns 403. Wrong *kind* of source even if reachable. |
| 6 | `disclosure-no-general-license` | tx.json | Uncited negative assertion about TX licensing law. Cite a provision or remove the clause. |
| 7 | `registration-number` advertising duty | pa.json | The statute cite is now correct for **contract** display (§517.7(a)(1)); the clause text still asserts an **advertising** duty no fetched source supports. Locate the provision or drop that half of the sentence. |
| 8 | `progress-payment-schedule` cite | ny.json | Still cites §771(1)(d), which is the mechanic's lien notice. The progress-payment schedule is §771(1)(f). Now doubly confusing, since §771(1)(d) is legitimately owned by the new `mechanics-lien-notice` clause. Out of Batch A scope. |
| 9 | `right-to-cancel` cite and `Pers. Prop. Law §428` | ny.json | Cancellation is §771(1)(h), not (1)(g); the cross-cite is unverified. |
| 10 | `written-contract` / `written-contract-terms` / `hicpa-contract-contents` completeness | ca.json, ny.json, pa.json | Each lists fewer required elements than its statute enumerates. No verbatim wording is prescribed, so these may be drafted — they are simply incomplete. |
| 11 | `>=` vs `>` threshold comparators | ca.json, ny.json, fl.json | CA/NY/FL statutes say "exceeds" / "over"; the triggers use `total >= threshold`, so a contract at exactly the threshold fires when it should not. FL is additionally inconsistent with its own `total > $2,500` sibling clause. |
| 12 | `recovery-fund-notice` wording and CILB address | fl.json | Unresolved whether §489.1425 prescribes wording or only substance; the contact details are set by **board rule** and must be pulled from the current rule, not a template. |
| 13 | Entire pricing dataset | trades/*.json | Commercially licensed cost data pending. See the Pricing data section — deliberately untouched. |
| 14 | BLS OEWS wage anchors | trades/*.json | `www.bls.gov` bot-blocks this environment (HTTP 403 on every path). No figure was recorded, and none was invented. |
| 15 | Named credentialed reviewer | portfolio | Construction attorney still not secured. Portfolio invariant 8 unsatisfied. |

## Cross-cutting

- **Batch A changed clause text, triggers, cites and schema** — see the Batch A
  remediation section. The earlier statement that "no values or clause text were
  changed" applied to the verification pass only and no longer describes the files.
- **The `UNVERIFIED — ATTORNEY REVIEW REQUIRED` prefix still lives inside the `text`
  fields of DRAFTED clauses** that get rendered into contracts. Batch A removed it from
  the nine prescribed-text clauses by removing their text entirely, but the prefix
  remains on the drafted ones. It is still not a safe place to carry the warning —
  confirm it can never reach a generated document.
- **Named credentialed reviewer (construction attorney) still not secured.** Portfolio
  invariant 8 is unsatisfied. Nothing in this document substitutes for that review:
  this pass checked whether encoded text matches its cited source, which is a much
  narrower question than whether the contract is legally sufficient.
- **Re-check cadence:** statutes change by legislative session — re-verify all five
  states annually and after any session in which a consumer-protection or lien bill
  passes. The Florida CILB recovery-fund contact details are set by **board rule** and
  can change without a statutory amendment. OEWS republishes annually each spring on a
  May reference date.
