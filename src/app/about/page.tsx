import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About JobPaper",
  description:
    "JobPaper is a free estimate, invoice and contract engine for solo and small-crew contractors. No signup, state-aware, every number traceable.",
};

export default function AboutPage() {
  return (
    <article className="density-reading mx-auto">
      <h1>About JobPaper</h1>
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
        the contract carries the clauses your state requires, each with its statute.
      </p>

      <h2>Where v1 honestly stands</h2>
      <p>
        Pricing is placeholder reference data pending licensed cost sources and review by
        two working contractors — see{" "}
        <Link href="/pricing-methodology" className="underline underline-offset-4">
          pricing methodology
        </Link>
        . Contract clause wording awaits construction attorney sign-off per state — see{" "}
        <Link href="/sources" className="underline underline-offset-4">
          sources
        </Link>
        . Both are flagged everywhere they appear and both are launch gates, described in
        the{" "}
        <Link href="/editorial-policy" className="underline underline-offset-4">
          editorial policy
        </Link>
        . A named, credentialed reviewer will be published here before either flag comes
        off.
      </p>

      <h2>Privacy</h2>
      <p>
        v1 stores nothing on a server. Your estimates and job facts live in your
        browser&apos;s local storage and nowhere else. No accounts, no tracking of your job
        data.
      </p>
    </article>
  );
}
