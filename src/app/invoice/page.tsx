import type { Metadata } from "next";

import InvoiceView from "@/components/InvoiceView";

export const metadata: Metadata = {
  title: "Invoice — Matches Your Estimate to the Cent",
  description:
    "Turn your takeoff sheet into an invoice that mirrors it line for line, tracks the deposit, and prints clean. Free, no signup.",
};

export default function InvoicePage() {
  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1>Your invoice</h1>
        <p className="text-dim mt-1" style={{ maxWidth: "var(--measure)" }}>
          Built from the estimate you saved — same lines, same total, to the cent.
        </p>
      </div>
      <InvoiceView />
    </div>
  );
}
