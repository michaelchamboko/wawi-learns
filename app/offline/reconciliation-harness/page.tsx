import { notFound } from "next/navigation";
import { ReconciliationHarness } from "./harness";

export default function ReconciliationHarnessPage() {
  if (process.env.WAWI_E2E_RECONCILIATION_HARNESS !== "1") notFound();
  return <ReconciliationHarness />;
}
