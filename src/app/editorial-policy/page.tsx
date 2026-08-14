import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy — Corrections, Review, Funding",
  description:
    "How JobPaper content is written, reviewed, corrected, and funded. Deterministic code decides; humans review; errors get fixed and logged.",
};

export default function EditorialPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Editorial policy</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">What decides, what explains</h2>
        <p>
          Every number on this site is computed by a deterministic engine from versioned,
          cited rules files. No AI computes prices, selects contract clauses, or writes
          legal language. Content pages are drafted by humans against the same rules files
          the engine uses, so prose and computation cannot drift apart.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Review requirements</h2>
        <p>
          Launch gates, not aspirations: pricing data must be sanity-checked by two working
          contractors, and each state&apos;s contract clause language must be signed off by a
          construction attorney before it loses its UNVERIFIED marker. Until then, every
          page and document carries the warning. Reviewer names and credentials will be
          published on the <Link href="/about" className="text-signal underline">about</Link>{" "}
          page when secured.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Corrections</h2>
        <p>
          A wrong number gets fixed within 48 hours of confirmation, with a dated entry in
          the <Link href="/changelog" className="text-signal underline">changelog</Link>{" "}
          naming what changed and why. We do not silently edit rules data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Funding disclosure</h2>
        <p>
          JobPaper is free and requires no signup. Planned revenue — advertising,
          unbranded-document upgrades, and clearly labelled software affiliations — never
          influences a computed estimate, a clause selection, or a recommendation.
        </p>
      </section>
    </article>
  );
}
