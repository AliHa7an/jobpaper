"use client";

/**
 * THE TAKEOFF SHEET — JobPaper's signature element.
 *
 * As the job is described, line items materialise on a ruled sheet in real
 * time: qty, unit, unit cost, labor hours and line total in mono columns,
 * with a large sticky running total. Editing any line recalculates within the
 * frame. Assumptions hang off their own lines as small pinned notes.
 *
 * The sheet IS the estimate IS the document: what is built on screen is
 * literally what the client receives, so the print stylesheet strips the site
 * chrome and the input dressing rather than re-laying anything out.
 *
 * There is no Calculate button (interaction spec M1). The answer exists before
 * the first keystroke, from taught defaults, and refines as inputs arrive.
 *
 * One orchestrated moment (700ms), on FIRST render only: the lines land in
 * sequence while the total climbs. Never on recalculation. Skipped entirely
 * under prefers-reduced-motion, which is checked in JS because the CSS token
 * collapses to 0ms but a JS-driven tween has to be told.
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

import {
  buildEstimate,
  findJobType,
  getTradeRules,
  lineLaborCents,
  lineMaterialCents,
  lineTotalCents,
  recomputeEstimate,
  REGION_LABELS,
  TRADE_IDS,
  TRADE_RULES,
  type AccessLevel,
  type Estimate,
  type Job,
  type LineItem,
  type MaterialGrade,
  type RegionId,
  type TradeId,
} from "@engine";

import {
  Button,
  Field,
  HeroNumber,
  LedgerTable,
  NumberInput,
  RadioGroup,
  Select,
  TraceDisclosure,
  WarningStack,
  type LedgerRow,
  type Warning,
} from "@/components/ui";
import { formatCents, formatDate, formatPct, usd } from "@/lib/format";
import { DUR_BASE, DUR_SIGNATURE, prefersReducedMotion } from "@/lib/motion";
import { saveEstimate } from "@/lib/store";

/* ── labels ─────────────────────────────────────────────────────────────── */

const GRADE_OPTIONS: { value: MaterialGrade; label: string; hint: string }[] = [
  { value: "economy", label: "Economy", hint: "Builder-grade materials" },
  { value: "mid", label: "Mid-grade", hint: "The usual choice" },
  { value: "premium", label: "Premium", hint: "Top-tier materials" },
];

const ACCESS_OPTIONS: { value: AccessLevel; label: string }[] = [
  { value: "easy", label: "Easy — truck at the work" },
  { value: "standard", label: "Standard — normal carry" },
  { value: "difficult", label: "Difficult — long carry, tight site" },
];

const TRADE_HINTS: Record<TradeId, string> = {
  decks: "New builds and resurfaces",
  "interior-paint": "Walls, ceilings, trim",
  "bathroom-remodel": "Demo through fixtures",
};

/** Per-line edits, held in the same canonical integers the inputs emit. */
type LineOverride = {
  /** hundredths of a unit — 211.2 sq ft is 21120 */
  qtyH?: number;
  unitCostCents?: number;
  /** hundredths of an hour — 12.75 hrs is 1275 */
  laborHoursH?: number;
};

const h = (n: number): number => Math.round(n * 100);

function defaultDims(trade: TradeId, jobTypeId: string): Record<string, number> {
  const jobType = findJobType(getTradeRules(trade), jobTypeId);
  const dims: Record<string, number> = {};
  for (const f of jobType.dimensionFields) dims[f.id] = f.default;
  return dims;
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function TakeoffBuilder() {
  const router = useRouter();

  const [trade, setTrade] = useState<TradeId>("decks");
  const [jobTypeId, setJobTypeId] = useState<string>("new-deck");
  const [dims, setDims] = useState<Record<string, number>>(() =>
    defaultDims("decks", "new-deck"),
  );
  const [grade, setGrade] = useState<MaterialGrade>("mid");
  const [access, setAccess] = useState<AccessLevel>("standard");
  const [region, setRegion] = useState<RegionId>("midwest");
  /** tenths of a percent — 10.0% is 100 */
  const [overheadTenths, setOverheadTenths] = useState(
    TRADE_RULES.decks.taughtDefaults.overheadBps / 10,
  );
  const [profitTenths, setProfitTenths] = useState(
    TRADE_RULES.decks.taughtDefaults.profitBps / 10,
  );
  const [overrides, setOverrides] = useState<Record<string, LineOverride>>({});

  const rules = getTradeRules(trade);
  const jobType = findJobType(rules, jobTypeId);

  /* The one orchestrated moment. "initial" is what the server renders, so
     hydration matches; a frame later it becomes "signature", and 700ms after
     that it is done for the rest of the session. */
  const [phase, setPhase] = useState<"initial" | "signature" | "live">("initial");
  useEffect(() => {
    // Both transitions happen inside callbacks, never synchronously in the
    // effect body: the first frame after mount starts the sequence, and a
    // reduced-motion reader skips straight to the end state in that same
    // frame, so the sheet is never mid-animation for them.
    const raf = requestAnimationFrame(() =>
      setPhase(prefersReducedMotion() ? "live" : "signature"),
    );
    const timer = window.setTimeout(() => setPhase("live"), DUR_SIGNATURE + 80);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  /* ── the engine call. Synchronous, client-side, under a frame. ────────── */

  const priceJob = useCallback(
    (dimensions: Record<string, number>): Estimate => {
      const clamped: Record<string, number> = {};
      for (const f of jobType.dimensionFields) {
        const raw = dimensions[f.id];
        const n = typeof raw === "number" && Number.isFinite(raw) ? raw : f.default;
        clamped[f.id] = Math.min(Math.max(n, f.min), f.max);
      }
      const job: Job = {
        trade,
        jobType: jobTypeId,
        inputs: { dimensions: clamped, grade, access, region },
      };
      return buildEstimate(rules, job, {
        overheadBps: Math.round(overheadTenths * 10),
        profitBps: Math.round(profitTenths * 10),
      });
    },
    [access, grade, jobType, jobTypeId, overheadTenths, profitTenths, region, rules, trade],
  );

  const estimate: Estimate = useMemo(() => {
    const base = priceJob(dims);
    const lineItems: LineItem[] = base.lineItems.map((li) => {
      const o = overrides[li.id];
      if (!o) return li;
      return {
        ...li,
        qty: o.qtyH === undefined ? li.qty : o.qtyH / 100,
        unitCostCents: o.unitCostCents ?? li.unitCostCents,
        laborHours: o.laborHoursH === undefined ? li.laborHours : o.laborHoursH / 100,
      };
    });
    return recomputeEstimate(rules, { ...base, lineItems });
  }, [dims, overrides, priceJob, rules]);

  /* ── handlers ─────────────────────────────────────────────────────────── */

  function switchTrade(next: TradeId) {
    const nextJobType = getTradeRules(next).jobTypes[0];
    if (!nextJobType) return;
    setTrade(next);
    setJobTypeId(nextJobType.id);
    setDims(defaultDims(next, nextJobType.id));
    setOverheadTenths(getTradeRules(next).taughtDefaults.overheadBps / 10);
    setProfitTenths(getTradeRules(next).taughtDefaults.profitBps / 10);
    setOverrides({});
  }

  function switchJobType(nextId: string) {
    setJobTypeId(nextId);
    setDims(defaultDims(trade, nextId));
    setOverrides({});
  }

  function setOverride(lineId: string, patch: LineOverride) {
    setOverrides((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }));
  }

  function goTo(path: "/invoice" | "/contract") {
    saveEstimate(estimate);
    router.push(path);
  }

  /* ── warnings. Flag orange, and only for these two. ───────────────────── */

  const warnings: Warning[] = [
    {
      id: "placeholder-pricing",
      severity: "irreversible",
      label: "Unverified pricing",
      title: (
        <>
          This sheet is an estimate only. It is not a binding quote, and every price on it
          is placeholder reference data rather than market cost data.
        </>
      ),
      body: (
        <>
          Check every line against your own suppliers and put your own numbers in before
          you send it. The moment you hand a customer a quote, it stops being an estimate —
          it is a number you have to honor.
        </>
      ),
    },
  ];
  if (estimate.staleRules) {
    warnings.push({
      id: "stale-rules",
      severity: "irreversible",
      label: "Stale data",
      title: (
        <>
          This pricing data is past its verification window — last verified{" "}
          <span className="num">{formatDate(estimate.rulesLastVerified)}</span>.
        </>
      ),
      body: <>Re-price the job from current supplier costs before quoting it.</>,
    });
  }

  /* ── line rendering ───────────────────────────────────────────────────── */

  const primaryCitation = rules.citations[0];

  function lineTrace(li: LineItem) {
    if (!primaryCitation) return null;
    return (
      <TraceDisclosure
        compact
        summaryLabel={`How ${li.description.toLowerCase()} was priced`}
        formula="qty × unit cost + labor hours × labor rate"
        inputs={[
          { label: "Quantity (waste included)", value: `${li.qty} ${li.unit}` },
          { label: "Unit cost", value: formatCents(li.unitCostCents) },
          { label: "Materials", value: formatCents(lineMaterialCents(li)) },
          { label: "Labor hours", value: li.laborHours },
          { label: "Labor rate", value: `${formatCents(li.laborRateCents)}/hr` },
          { label: "Labor", value: formatCents(lineLaborCents(li)) },
          { label: "Regional multiplier", value: `${estimate.regionalMultiplierBps / 100}%` },
          { label: "Basis", value: li.basis },
        ]}
        ruleVersion={estimate.ruleSetVersion}
        citation={primaryCitation}
      />
    );
  }

  /** The per-row delay that makes the lines land in sequence, not at once. */
  function lineAnimation(index: number, count: number): CSSProperties | undefined {
    if (phase !== "signature") return undefined;
    const span = Math.max(1, count - 1);
    const stagger = Math.min(90, (DUR_SIGNATURE - 240) / span);
    return {
      animation: `takeoff-line-in 240ms var(--ease) both`,
      animationDelay: `${Math.round(index * stagger)}ms`,
    };
  }

  const lineCount = estimate.lineItems.length;

  const ledgerRows: LedgerRow[] = estimate.lineItems.map((li, index) => ({
    id: li.id,
    cells: {
      item: (
        <span
          className="flex min-w-0 flex-col items-start gap-1"
          style={{ maxWidth: "20rem", ...lineAnimation(index, lineCount) }}
        >
          <span className="text-ink font-medium">{li.description}</span>
          {li.assumptions.map((a) => (
            <span key={a} className="pinned-note">
              {a}
            </span>
          ))}
          <span className="no-print">{lineTrace(li)}</span>
        </span>
      ),
      qty: (
        <NumberInput
          id={`qty-${li.id}`}
          className="w-[5.25rem]"
          aria-label={`Quantity — ${li.description}`}
          unit="hundredths"
          value={overrides[li.id]?.qtyH ?? h(li.qty)}
          onChange={(n) => setOverride(li.id, { qtyH: n })}
          min={0}
          max={1_000_000}
          step={100}
        />
      ),
      unit: <span className="text-dim">{li.unit}</span>,
      unitCost: (
        <NumberInput
          id={`cost-${li.id}`}
          className="w-[6.5rem]"
          aria-label={`Unit cost — ${li.description}`}
          unit="cents"
          value={overrides[li.id]?.unitCostCents ?? li.unitCostCents}
          onChange={(n) => setOverride(li.id, { unitCostCents: n })}
          min={0}
          max={100_000_000}
          step={100}
        />
      ),
      hours: (
        <NumberInput
          id={`hrs-${li.id}`}
          className="w-[5.25rem]"
          aria-label={`Labor hours — ${li.description}`}
          unit="hundredths"
          value={overrides[li.id]?.laborHoursH ?? h(li.laborHours)}
          onChange={(n) => setOverride(li.id, { laborHoursH: n })}
          min={0}
          max={100_000}
          step={25}
        />
      ),
      total: <span style={{ fontWeight: 500 }}>{formatCents(lineTotalCents(li))}</span>,
    },
  }));

  /* ── M8: copy that reacts. Deterministic template, engine-exact figures.
     One point of profit is 100 bps applied to (subtotal + overhead) — the
     same arithmetic the engine ran, not an approximation of it. ─────────── */

  const perPointCents = Math.round(
    (estimate.totals.subtotalCents + estimate.totals.overheadCents) / 100,
  );

  /* ── render ───────────────────────────────────────────────────────────── */

  const meta = `${GRADE_OPTIONS.find((g) => g.value === grade)?.label ?? ""} · ${
    REGION_LABELS[region]
  } · ${ACCESS_OPTIONS.find((a) => a.value === access)?.label ?? ""}`;

  return (
    <div className="relative">
      <div className="takeoff-grid grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {/* ── the job ─────────────────────────────────────────────────── */}
        <form
          className="no-print flex flex-col gap-5"
          aria-label="Describe the job"
          onSubmit={(e) => e.preventDefault()}
        >
          <Field label="Trade" htmlFor="trade">
            <RadioGroup
              name="trade"
              value={trade}
              onChange={(v) => switchTrade(v as TradeId)}
              options={TRADE_IDS.map((t) => ({
                value: t,
                label: TRADE_RULES[t].label,
                hint: TRADE_HINTS[t],
              }))}
            />
          </Field>

          <Field label="Job type" htmlFor="jobType">
            <Select
              id="jobType"
              value={jobTypeId}
              onChange={switchJobType}
              options={rules.jobTypes.map((jt) => ({ value: jt.id, label: jt.label }))}
            />
          </Field>

          <fieldset className="min-w-0 border-0 p-0">
            <legend className="micro-label mb-2">Measurements</legend>
            <div className="grid grid-cols-2 gap-3">
              {jobType.dimensionFields.map((f) => (
                <Field
                  key={f.id}
                  label={`${f.label} (${f.unit})`}
                  htmlFor={`dim-${f.id}`}
                  className="min-w-0"
                >
                  <NumberInput
                    id={`dim-${f.id}`}
                    unit="count"
                    value={dims[f.id] ?? f.default}
                    onChange={(n) => setDims((prev) => ({ ...prev, [f.id]: n }))}
                    min={f.min}
                    max={f.max}
                    step={1}
                    constraintHint={
                      <>
                        <span className="num">{f.min}</span>–
                        <span className="num">{f.max}</span> {f.unit}
                      </>
                    }
                  />
                </Field>
              ))}
            </div>
          </fieldset>

          <Field label="Materials grade" htmlFor="grade">
            <RadioGroup
              name="grade"
              value={grade}
              onChange={(v) => setGrade(v as MaterialGrade)}
              options={GRADE_OPTIONS}
            />
          </Field>

          <Field label="Site access" htmlFor="access" hint="Sets the labor multiplier.">
            <Select
              id="access"
              value={access}
              onChange={(v) => setAccess(v as AccessLevel)}
              options={ACCESS_OPTIONS}
            />
          </Field>

          <Field label="Region" htmlFor="region" hint="Adjusts material and labor costs.">
            <Select
              id="region"
              value={region}
              onChange={(v) => setRegion(v as RegionId)}
              options={(Object.keys(REGION_LABELS) as RegionId[]).map((r) => ({
                value: r,
                label: REGION_LABELS[r],
              }))}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Overhead"
              htmlFor="overhead"
              hint={`Trucks, insurance, tools. Taught default ${
                rules.taughtDefaults.overheadBps / 100
              }%.`}
              className="min-w-0"
            >
              <NumberInput
                id="overhead"
                unit="pct"
                value={overheadTenths}
                onChange={setOverheadTenths}
                min={0}
                max={1000}
              />
            </Field>
            <Field
              label="Profit"
              htmlFor="profit"
              hint={`Pay yourself. Taught default ${rules.taughtDefaults.profitBps / 100}%.`}
              className="min-w-0"
            >
              <NumberInput
                id="profit"
                unit="pct"
                value={profitTenths}
                onChange={setProfitTenths}
                min={0}
                max={1000}
              />
            </Field>
          </div>
        </form>

        {/* ── the sheet ───────────────────────────────────────────────── */}
        <section aria-labelledby="sheet-heading" className="min-w-0">
          <div
            className="print-sheet hairline-all rounded-atlas min-w-0 p-4 sm:p-6"
            style={{ borderRadius: "var(--radius-atlas)", background: "var(--paper)" }}
          >
            <header className="hairline-b mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pb-3">
              <div className="min-w-0">
                <p className="micro-label">Estimate</p>
                <h2 id="sheet-heading">
                  {rules.label} — {jobType.label}
                </h2>
                <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
                  {meta}
                </p>
              </div>
              <div>
                <p className="micro-label">Estimated range — not a quote</p>
                <p className="num text-signal" style={{ fontSize: "var(--text-step-1)", fontWeight: 500 }}>
                  {usd(estimate.range.lowCents)}–{usd(estimate.range.highCents)}
                </p>
              </div>
            </header>

            <WarningStack warnings={warnings} className="mb-4" />

            {/* Phone: the same lines, stacked, every control under one thumb. */}
            <ul className="sheet-stack density-instrument m-0 list-none p-0 md:hidden">
              {estimate.lineItems.map((li, index) => (
                <li
                  key={li.id}
                  className="takeoff-row py-3"
                  style={lineAnimation(index, lineCount)}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-ink" style={{ fontWeight: 600 }}>
                      {li.description}
                    </span>
                    <span className="num num-cell text-ink" style={{ fontWeight: 500 }}>
                      {formatCents(lineTotalCents(li))}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Field label={`Qty (${li.unit})`} htmlFor={`m-qty-${li.id}`} className="min-w-0">
                      <NumberInput
                        id={`m-qty-${li.id}`}
                        unit="hundredths"
                        value={overrides[li.id]?.qtyH ?? h(li.qty)}
                        onChange={(n) => setOverride(li.id, { qtyH: n })}
                        min={0}
                        max={1_000_000}
                        step={100}
                      />
                    </Field>
                    <Field label="Unit cost" htmlFor={`m-cost-${li.id}`} className="min-w-0">
                      <NumberInput
                        id={`m-cost-${li.id}`}
                        unit="cents"
                        value={overrides[li.id]?.unitCostCents ?? li.unitCostCents}
                        onChange={(n) => setOverride(li.id, { unitCostCents: n })}
                        min={0}
                        max={100_000_000}
                        step={100}
                      />
                    </Field>
                    <Field label="Labor hrs" htmlFor={`m-hrs-${li.id}`} className="min-w-0">
                      <NumberInput
                        id={`m-hrs-${li.id}`}
                        unit="hundredths"
                        value={overrides[li.id]?.laborHoursH ?? h(li.laborHours)}
                        onChange={(n) => setOverride(li.id, { laborHoursH: n })}
                        min={0}
                        max={100_000}
                        step={25}
                      />
                    </Field>
                  </div>

                  {li.assumptions.map((a) => (
                    <span key={a} className="pinned-note mt-2">
                      {a}
                    </span>
                  ))}
                  <div className="no-print mt-2">{lineTrace(li)}</div>
                </li>
              ))}
            </ul>

            {/* Tablet and up — and every printed sheet — get the ruled table. */}
            <div className="sheet-table hidden md:block">
              <LedgerTable
                caption={`Takeoff: ${lineCount} line items for a ${rules.label.toLowerCase()} job, priced from ruleset ${estimate.ruleSetVersion}`}
                columns={[
                  { id: "item", label: "Item" },
                  { id: "qty", label: "Qty", numeric: true },
                  { id: "unit", label: "Unit" },
                  { id: "unitCost", label: "Unit cost", numeric: true },
                  { id: "hours", label: "Labor hrs", numeric: true },
                  { id: "total", label: "Line total", numeric: true },
                ]}
                rows={ledgerRows}
              />
            </div>

            {/* Totals: the ruled-off foot of the sheet. */}
            <dl
              className="density-instrument mt-4 ml-auto flex max-w-xs flex-col gap-1"
              style={{ fontSize: "var(--text-step--1)" }}
            >
              {(
                [
                  ["Materials", estimate.totals.materialsCents],
                  ["Labor", estimate.totals.laborCents],
                  ["Subtotal", estimate.totals.subtotalCents],
                  [`Overhead ${estimate.overheadBps / 100}%`, estimate.totals.overheadCents],
                  [`Profit ${estimate.profitBps / 100}%`, estimate.totals.profitCents],
                ] as const
              ).map(([label, cents]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-dim">{label}</dt>
                  <dd className="num num-cell text-ink">{formatCents(cents)}</dd>
                </div>
              ))}
              <div
                className="mt-1 flex items-baseline justify-between gap-4 pt-2"
                style={{ borderTop: "2px solid var(--ink)" }}
              >
                <dt style={{ fontWeight: 600 }}>Total</dt>
                <dd className="num num-cell" style={{ fontWeight: 600 }}>
                  {formatCents(estimate.totals.totalCents)}
                </dd>
              </div>
            </dl>

            <p
              className="text-ink mt-3 ml-auto max-w-xs"
              style={{ fontSize: "var(--text-step--1)", lineHeight: 1.35 }}
            >
              At <span className="num">{formatPct(estimate.profitBps / 100)}</span> profit
              you clear <span className="num">{formatCents(estimate.totals.profitCents)}</span>{" "}
              on this job — <span className="num">{formatCents(perPointCents)}</span> for
              each point you add.
            </p>

            <footer
              className="hairline-t text-dim mt-6 pt-3"
              style={{ fontSize: "var(--text-step--2)" }}
            >
              <p style={{ maxWidth: "var(--measure)" }}>
                Ruleset <span className="num">{estimate.ruleSetVersion}</span> · pricing
                last verified{" "}
                <span className="num">{formatDate(estimate.rulesLastVerified)}</span> ·
                regional multiplier{" "}
                <span className="num">{estimate.regionalMultiplierBps / 100}%</span> ·
                labor{" "}
                <span className="num">
                  {formatCents(estimate.lineItems[0]?.laborRateCents ?? 0)}
                </span>
                /hr. This sheet is an estimate only and is not a binding quote — actual
                costs vary with site conditions.
              </p>
            </footer>
          </div>

          <div className="no-print mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" className="touch-lg" onClick={() => goTo("/contract")}>
              Create the contract
            </Button>
            <Button
              variant="secondary"
              className="touch-lg"
              onClick={() => {
                saveEstimate(estimate);
                window.print();
              }}
            >
              Print this sheet
            </Button>
          </div>
        </section>
      </div>

      {/* ── the running total: large, sticky, and always the one big number.
             ONE action rides with it. The other two sit at the foot of the
             sheet, where the document ends — a bar carrying three buttons ate
             a third of a 375px viewport, which is a third of the sheet the
             contractor came to read. ───────────────────────────────────────*/}
      <div
        className="no-print hairline-t sticky bottom-0 z-30 -mx-4 mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 py-3"
        style={{ background: "var(--paper-raised)" }}
      >
        <HeroNumber
          label="Running total"
          value={phase === "initial" ? 0 : estimate.totals.totalCents}
          format={formatCents}
          tween
          tweenMs={phase === "signature" ? DUR_SIGNATURE : DUR_BASE}
        />
        <Button className="touch-lg" onClick={() => goTo("/invoice")}>
          Create the matching invoice
        </Button>
      </div>
    </div>
  );
}
