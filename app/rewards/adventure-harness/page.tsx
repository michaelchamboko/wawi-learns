import { notFound } from "next/navigation";
import { AdventureHarness } from "./harness";

export default function AdventureHarnessPage() {
  if (process.env.WAWI_E2E_ADVENTURE_HARNESS !== "1") notFound();
  return <AdventureHarness />;
}
