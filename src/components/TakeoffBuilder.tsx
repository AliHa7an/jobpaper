"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  buildEstimate,
  findJobType,
  formatCents,
  formatCentsWholeDollars,
  getTradeRules,
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

import { saveEstimate } from "@/lib/store";

interface BuilderFormValues {
  grade: MaterialGrade;
  access: AccessLevel;
  region: RegionId;
  overheadPct: number;
  profitPct: number;
  dims: Record<string, number>;
}

/** Per-line user edits, kept as raw strings so typing stays smooth. */
type LineOverrides = Record<
  string,
  { qty?: string; unitCostDollars?: string; laborHours?: string }
>;

function parsePositive(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parseDollarsToCents(raw: string | undefined): number | undefined {
  const n = parsePositive(raw);
  return n === undefined ? undefined : Math.round(n * 100);
}

function defaultsFor(trade: TradeId, jobTypeId: string): BuilderFormValues {
  const rules = getTradeRules(trade);
  const jobType = findJobType(rules, jobTypeId);
  const dims: Record<string, number> = {};
  for (const f of jobType.dimensionFields) dims[f.id] = f.default;
  return {
    grade: "mid",
    access: "standard",
    region: "midwest",
    overheadPct: rules.taughtDefaults.overheadBps / 100,
    profitPct: rules.taughtDefaults.profitBps / 100,
    dims,
  };
}

const GRADE_LABELS: Record<MaterialGrade, string> = {
  economy: "Economy",
  mid: "Mid-grade",
  premium: "Premium",
};

const ACCESS_LABELS: Record<AccessLevel, string> = {
  easy: "Easy access",
  standard: "Standard access",
  difficult: "Difficult access",
};

export default function TakeoffBuilder() {
  const router = useRouter();
  const [trade, setTrade] = useState<TradeId>("decks");
  const [jobTypeId, setJobTypeId] = useState<string>("new-deck");
  const [overrides, setOverrides] = useState<LineOverrides>({});

  const { register, watch, reset } = useForm<BuilderFormValues>({
    mode: "onChange",
    defaultValues: defaultsFor("decks", "new-deck"),
  });
  const values = watch();

  const rules = getTradeRules(trade);
  const jobType = findJobType(rules, jobTypeId);

  function switchTrade(next: TradeId) {
    const nextJobType = getTradeRules(next).jobTypes[0];
    if (!nextJobType) return;
    setTrade(next);
    setJobTypeId(nextJobType.id);
    setOverrides({});
    reset(defaultsFor(next, nextJobType.id));
  }

  function switchJobType(nextId: string) {
    setJobTypeId(nextId);
    setOverrides({});
    reset(defaultsFor(trade, nextId));
  }

  const estimate: Estimate = useMemo(() => {
    const dims: Record<string, number> = {};
    for (const f of jobType.dimensionFields) {
      const raw = values.dims?.[f.id];
      const n = typeof raw === "number" && Number.isFinite(raw) ? raw : f.default;
      dims[f.id] = Math.min(Math.max(n, f.min), f.max);
    }
    const job: Job = {
      trade,
      jobType: jobTypeId,
      inputs: {
        dimensions: dims,
        grade: values.grade ?? "mid",
        access: values.access ?? "standard",
        region: values.region ?? "midwest",
      },
    };
    const overheadBps = Number.isFinite(values.overheadPct)
      ? Math.round(values.overheadPct * 100)
      : rules.taughtDefaults.overheadBps;
    const profitBps = Number.isFinite(values.profitPct)
      ? Math.round(values.profitPct * 100)
      : rules.taughtDefaults.profitBps;

    const base = buildEstimate(rules, job, {
      overheadBps: Math.min(Math.max(overheadBps, 0), 10000),
      profitBps: Math.min(Math.max(profitBps, 0), 10000),
    });

    const lineItems: LineItem[] = base.lineItems.map((li) => {
      const o = overrides[li.id];
      if (!o) return li;
      return {
        ...li,
        qty: parsePositive(o.qty) ?? li.qty,
        unitCostCents: parseDollarsToCents(o.unitCostDollars) ?? li.unitCostCents,
        laborHours: parsePositive(o.laborHours) ?? li.laborHours,
      };
    });
    return recomputeEstimate(rules, { ...base, lineItems });
  }, [trade, jobTypeId, jobType, rules, values, overrides]);

  function setOverride(
    lineId: string,
    field: "qty" | "unitCostDollars" | "laborHours",
    raw: string,
  ) {
    setOverrides((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], [field]: raw },
    }));
  }

  function saveAndGo(path: "/invoice" | "/contract") {
    saveEstimate(estimate);
    router.push(path);
  }

  const inputClass =
    "w-full rounded border border-rule bg-sheet px-3 py-2 text-ink num";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      {/* ---------------- Job builder form ---------------- */}
      <form className="no-print space-y-5" aria-label="Job builder">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Trade</legend>
          <div className="grid gap-2">
            {TRADE_IDS.map((t) => (
              <label
                key={t}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded border px-3 py-2 ${
                  trade === t ? "border-signal bg-sheet font-semibold" : "border-rule bg-sheet"
                }`}
              >
                <input
                  type="radio"
                  name="trade"
                  checked={trade === t}
                  onChange={() => switchTrade(t)}
                />
                {TRADE_RULES[t].label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="jobType" className="mb-2 block text-sm font-semibold">
            Job type
          </label>
          <select
            id="jobType"
            className={inputClass}
            value={jobTypeId}
            onChange={(e) => switchJobType(e.target.value)}
          >
            {rules.jobTypes.map((jt) => (
              <option key={jt.id} value={jt.id}>
                {jt.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Dimensions</legend>
          <div className="grid grid-cols-2 gap-3">
            {jobType.dimensionFields.map((f) => (
              <div key={f.id}>
                <label htmlFor={`dim-${f.id}`} className="mb-1 block text-sm text-dim">
                  {f.label}
                  {f.unit ? ` (${f.unit})` : ""}
                </label>
                <input
                  id={`dim-${f.id}`}
                  type="number"
                  inputMode="decimal"
                  min={f.min}
                  max={f.max}
                  className={inputClass}
                  {...register(`dims.${f.id}`, { valueAsNumber: true })}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Materials grade</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GRADE_LABELS) as MaterialGrade[]).map((g) => (
              <label
                key={g}
                className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border border-rule bg-sheet px-2 py-2 text-sm has-checked:border-signal has-checked:font-semibold"
              >
                <input type="radio" value={g} {...register("grade")} />
                {GRADE_LABELS[g]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="access" className="mb-1 block text-sm font-semibold">
              Site access
            </label>
            <select id="access" className={inputClass} {...register("access")}>
              {(Object.keys(ACCESS_LABELS) as AccessLevel[]).map((a) => (
                <option key={a} value={a}>
                  {ACCESS_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="region" className="mb-1 block text-sm font-semibold">
              Region
            </label>
            <select id="region" className={inputClass} {...register("region")}>
              {(Object.keys(REGION_LABELS) as RegionId[]).map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="overheadPct" className="mb-1 block text-sm font-semibold">
              Overhead %
            </label>
            <input
              id="overheadPct"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.5}
              className={inputClass}
              {...register("overheadPct", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-dim">
              Taught default {rules.taughtDefaults.overheadBps / 100}% — trucks, insurance,
              tools.
            </p>
          </div>
          <div>
            <label htmlFor="profitPct" className="mb-1 block text-sm font-semibold">
              Profit %
            </label>
            <input
              id="profitPct"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.5}
              className={inputClass}
              {...register("profitPct", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-dim">
              Taught default {rules.taughtDefaults.profitBps / 100}% — pay yourself.
            </p>
          </div>
        </div>
      </form>

      {/* ---------------- The Takeoff Sheet ---------------- */}
      <section aria-label="Takeoff sheet" className="min-w-0">
        <div className="print-sheet rounded border border-rule bg-sheet p-4 shadow-sm sm:p-6">
          <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-3">
            <div>
              <p className="text-xs font-semibold tracking-widest text-dim">ESTIMATE</p>
              <h2 className="text-xl font-bold">
                {rules.label} — {jobType.label}
              </h2>
              <p className="text-sm text-dim">
                {GRADE_LABELS[estimate.job.inputs.grade]} ·{" "}
                {REGION_LABELS[estimate.job.inputs.region]} ·{" "}
                {ACCESS_LABELS[estimate.job.inputs.access]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-dim">Estimated range</p>
              <p className="num text-2xl font-semibold">
                {formatCentsWholeDollars(estimate.range.lowCents)}–
                {formatCentsWholeDollars(estimate.range.highCents)}
              </p>
            </div>
          </header>

          <p className="mb-3 border-l-4 border-flag pl-3 text-sm font-medium text-flag">
            Placeholder pricing — v1 reference data, not market quotes. Check unit costs
            against your suppliers before sending. See the pricing methodology page.
          </p>

          {estimate.staleRules ? (
            <p className="mb-3 border-l-4 border-flag pl-3 text-sm font-medium text-flag">
              Stale rules: this pricing data is past its verification window
              (last verified {estimate.rulesLastVerified}). Re-check before quoting.
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink text-left text-xs uppercase tracking-wide text-dim">
                  <th scope="col" className="py-2 pe-2 font-semibold">
                    Item
                  </th>
                  <th scope="col" className="w-20 px-1 py-2 text-right font-semibold">
                    Qty
                  </th>
                  <th scope="col" className="w-16 px-1 py-2 font-semibold">
                    Unit
                  </th>
                  <th scope="col" className="w-24 px-1 py-2 text-right font-semibold">
                    Unit cost
                  </th>
                  <th scope="col" className="w-20 px-1 py-2 text-right font-semibold">
                    Labor hrs
                  </th>
                  <th scope="col" className="w-28 ps-1 py-2 text-right font-semibold">
                    Line total
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.lineItems.map((li) => (
                  <tr key={li.id} className="takeoff-row align-top">
                    <td className="py-2 pe-2">
                      <span className="font-medium">{li.description}</span>
                      <span className="block text-xs text-dim">{li.basis}</span>
                      {li.assumptions.map((a) => (
                        <span
                          key={a}
                          className="mt-0.5 block border-l-2 border-rule ps-2 text-xs italic text-dim"
                        >
                          {a}
                        </span>
                      ))}
                    </td>
                    <td className="px-1 py-2 text-right">
                      <input
                        aria-label={`Quantity: ${li.description}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        className="num w-full rounded border border-rule bg-sheet px-1 py-1 text-right"
                        value={overrides[li.id]?.qty ?? String(li.qty)}
                        onChange={(e) => setOverride(li.id, "qty", e.target.value)}
                      />
                    </td>
                    <td className="num px-1 py-2 text-xs text-dim">{li.unit}</td>
                    <td className="px-1 py-2 text-right">
                      <input
                        aria-label={`Unit cost in dollars: ${li.description}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.01}
                        className="num w-full rounded border border-rule bg-sheet px-1 py-1 text-right"
                        value={
                          overrides[li.id]?.unitCostDollars ??
                          String(li.unitCostCents / 100)
                        }
                        onChange={(e) =>
                          setOverride(li.id, "unitCostDollars", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-1 py-2 text-right">
                      <input
                        aria-label={`Labor hours: ${li.description}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.25}
                        className="num w-full rounded border border-rule bg-sheet px-1 py-1 text-right"
                        value={overrides[li.id]?.laborHours ?? String(li.laborHours)}
                        onChange={(e) => setOverride(li.id, "laborHours", e.target.value)}
                      />
                    </td>
                    <td className="num ps-1 py-2 text-right font-medium">
                      {formatCents(lineTotalCents(li))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ms-auto mt-4 max-w-xs space-y-1 text-sm">
            {(
              [
                ["Materials", estimate.totals.materialsCents],
                ["Labor", estimate.totals.laborCents],
                ["Subtotal", estimate.totals.subtotalCents],
                [`Overhead (${estimate.overheadBps / 100}%)`, estimate.totals.overheadCents],
                [`Profit (${estimate.profitBps / 100}%)`, estimate.totals.profitCents],
              ] as const
            ).map(([label, cents]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-dim">{label}</dt>
                <dd className="num">{formatCents(cents)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t-2 border-ink pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="num">{formatCents(estimate.totals.totalCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-dim">Quote as</dt>
              <dd className="num font-semibold">
                {formatCentsWholeDollars(estimate.range.lowCents)}–
                {formatCentsWholeDollars(estimate.range.highCents)}
              </dd>
            </div>
          </dl>

          <footer className="mt-6 border-t border-rule pt-3 text-xs text-dim">
            <p>
              Ruleset {estimate.ruleSetVersion} · pricing last verified{" "}
              <span className="num">{estimate.rulesLastVerified}</span> · regional
              multiplier <span className="num">{estimate.regionalMultiplierBps / 100}%</span>{" "}
              · labor rate <span className="num">{formatCents(estimate.lineItems[0]?.laborRateCents ?? 0)}</span>
              /hr. Estimate template — actual costs vary with site conditions.
            </p>
          </footer>
        </div>

        {/* Sticky running total + actions */}
        <div className="no-print sticky bottom-0 mt-4 flex flex-wrap items-center gap-3 rounded border border-rule bg-sheet p-3 shadow-lg">
          <p className="me-auto">
            <span className="block text-xs text-dim">Running total</span>
            <span className="num text-2xl font-bold">
              {formatCents(estimate.totals.totalCents)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => saveAndGo("/invoice")}
            className="rounded bg-signal px-4 py-2.5 font-semibold text-white"
          >
            Create matching invoice
          </button>
          <button
            type="button"
            onClick={() => saveAndGo("/contract")}
            className="rounded border-2 border-signal px-4 py-2.5 font-semibold text-signal"
          >
            Create state contract
          </button>
          <button
            type="button"
            onClick={() => {
              saveEstimate(estimate);
              window.print();
            }}
            className="rounded border border-rule px-4 py-2.5 font-semibold"
          >
            Print estimate
          </button>
        </div>
      </section>
    </div>
  );
}
