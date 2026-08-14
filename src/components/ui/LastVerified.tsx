import { formatDate } from "@/lib/format";

/**
 * LastVerified — "Rules verified 8 Aug 2026 · ruleset 2026.08.1 · 34 C.F.R. § 685.209"
 *
 * Driven by data, never hand-written. The date comes from the ruleset's own
 * `lastVerified` field, so it cannot drift out of sync with the rules the
 * engine actually ran. Google and readers both detect fake freshness; a date
 * that moves when nothing changed is worse than no date at all.
 *
 * Item 3 in the page skeleton — it sits directly under the AnswerBox on every
 * content page.
 */

export type LastVerifiedProps = {
  /** ISO date from the ruleset. Rendered "8 Aug 2026", never 08/08/2026. */
  date: string;
  /** The ruleset version the figures on this page were computed against. */
  ruleSetVersion: string;
  /** The primary source. One citation — the full list belongs in <SourceCitation>. */
  citation: { label: string; url: string };
  className?: string;
};

export function LastVerified({
  date,
  ruleSetVersion,
  citation,
  className,
}: LastVerifiedProps) {
  return (
    <p
      className={["flex flex-wrap items-center gap-x-2 gap-y-1 text-dim", className]
        .filter(Boolean)
        .join(" ")}
      style={{ fontSize: "var(--text-step--1)", margin: 0 }}
    >
      <span>
        Rules verified{" "}
        <time className="num text-ink" dateTime={date}>
          {formatDate(date)}
        </time>
      </span>

      <Separator />

      <span>
        Ruleset <span className="num text-ink">{ruleSetVersion}</span>
      </span>

      <Separator />

      <a
        href={citation.url}
        className="rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current"
        style={{
          borderRadius: "var(--radius-atlas)",
          transitionDuration: "var(--dur-fast)",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        {citation.label}
      </a>
    </p>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" className="text-rule">
      ·
    </span>
  );
}
