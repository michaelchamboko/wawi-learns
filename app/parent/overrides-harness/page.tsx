import { notFound } from "next/navigation";
import { OverridesHarness } from "./harness";

export default function OverridesHarnessPage() {
  if (process.env.WAWI_E2E_OVERRIDES_HARNESS !== "1") notFound();
  return <OverridesHarness />;
}
