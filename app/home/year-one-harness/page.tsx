import { notFound } from "next/navigation";
import { YearOneHarness } from "./harness";

export default function YearOneHarnessPage() {
  if (process.env.WAWI_E2E_YEAR_ONE_HARNESS !== "1") notFound();
  return <YearOneHarness />;
}
