import type { Metadata } from "next";

import ContractView from "@/components/ContractView";

export const metadata: Metadata = {
  title: "Contract Template — State-Required Clauses, Cited",
  description:
    "Generate a home improvement contract template carrying the clauses your state requires for a job this size, each with its statute. Template, not legal advice. Free, no signup.",
};

export default function ContractPage() {
  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1>Your contract template</h1>
        <p className="text-dim mt-1" style={{ maxWidth: "var(--measure)" }}>
          Clauses are selected from your state&apos;s rules and this job&apos;s facts —
          contract price and down payment. Every clause carries its statute.
        </p>
      </div>
      <ContractView />
    </div>
  );
}
