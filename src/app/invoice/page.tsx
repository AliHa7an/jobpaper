import type { Metadata } from "next";

import InvoiceView from "@/components/InvoiceView";

export const metadata: Metadata = {
  title: "Invoice — Matches Your Estimate to the Cent",
  description:
    "Generate an invoice that mirrors your takeoff-sheet estimate line for line, with deposit tracking and a printable layout. Free, no signup.",
};

export default function InvoicePage() {
  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-3xl font-bold">Your invoice</h1>
        <p className="mt-1 max-w-2xl text-dim">
          Built from your saved estimate — same lines, same total, to the cent.
        </p>
      </div>
      <InvoiceView />
    </div>
  );
}
