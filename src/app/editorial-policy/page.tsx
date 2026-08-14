import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy — Corrections, Review, Funding",
  description:
    "How JobPaper content is written, reviewed, corrected and funded. Deterministic code decides; humans review; errors get fixed and logged.",
};

export default function EditorialPolicyPage() {
  return (
    <article className="density-reading mx-auto">
      <h1>Editorial policy</h1>

      <h2>What decides, what explains</h2>
      <p>
        Every number on this site is computed by a deterministic engine from versioned,
        cited rules files. No AI computes prices, selects contract clauses, or writes legal
        language. Content pages are drafted by humans against the same rules files the
        engine uses, so prose and computation cannot drift apart.
      </p>

      <h2>Review requirements</h2>
      <p>
        Launch gates, not aspirations: pricing data must be sanity-checked by two working
        contractors, and each state&apos;s contract clause language must be signed off by a
        construction attorney before it loses its unverified marker. Until then, every page
        and every generated document carries the warning. Reviewer names and credentials
        will be published on the{" "}
        <Link href="/about" className="underline underline-offset-4">
          about
        </Link>{" "}
        page when secured.
      </p>

      <h2>Corrections</h2>
      <p>
        A wrong number is fixed within 48 hours of confirmation, with a dated entry in the{" "}
        <Link href="/changelog" className="underline underline-offset-4">
          changelog
        </Link>{" "}
        naming what changed and why. Rules data is never silently edited.
      </p>

      <h2>Funding disclosure</h2>
      <p>
        JobPaper is free and requires no signup. Planned revenue — advertising,
        unbranded-document upgrades, and clearly labeled software affiliations — never
        influences a computed estimate, a clause selection, or a recommendation.
      </p>
    </article>
  );
}
