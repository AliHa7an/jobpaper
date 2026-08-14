import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About JobPaper",
  description:
    "JobPaper is a free estimate, invoice, and contract engine for solo and small-crew contractors. No signup, state-aware, every number traceable.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">About JobPaper</h1>
      <p>
        JobPaper exists because solo and small-crew contractors quote jobs in text
        messages, underprice from guesswork, and sign contracts missing clauses their state
        requires. Field-service software solves this for $50–200 a month behind a signup
        wall; template sites hand out state-blind Word files. JobPaper is the gap: free, no
        signup, state-aware — and it helps with the pricing, not just the paper.
      </p>
      <p>
        Quote it right. Paper it right. Get paid. The estimate you build on the takeoff
        sheet is the document your customer receives; the invoice matches it to the cent;
        the contract carries the clauses your state requires, each with its statute cite.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Where v1 honestly stands</h2>
        <p>
          Pricing is placeholder reference data pending licensed cost sources and review by
          working contractors (<Link href="/pricing-methodology" className="text-signal underline">pricing methodology</Link>).
          Contract clause wording awaits construction attorney sign-off per state (<Link href="/sources" className="text-signal underline">sources</Link>).
          Both are flagged everywhere they appear, and both are launch gates — see the{" "}
          <Link href="/editorial-policy" className="text-signal underline">editorial policy</Link>.
          A named, credentialed reviewer will be published here before those flags come
          off.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Privacy</h2>
        <p>
          v1 stores nothing on a server. Your estimates and job facts live in your
          browser&apos;s local storage and nowhere else. No accounts, no tracking of your
          job data.
        </p>
      </section>
    </article>
  );
}
