import type { Metadata } from "next";

import ContractView from "@/components/ContractView";

export const metadata: Metadata = {
  title: "Contract Template — State-Required Clauses, Cited",
  description:
    "Generate a home improvement contract template with the clauses your state requires, each with its statute cite. Template, not legal advice. Free, no signup.",
};

export default function ContractPage() {
  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-3xl font-bold">Your contract template</h1>
        <p className="mt-1 max-w-2xl text-dim">
          Clauses are selected deterministically from your state&apos;s rules and this
          job&apos;s facts — total price and down payment. Every clause shows its statute.
        </p>
      </div>
      <ContractView />
    </div>
  );
}
