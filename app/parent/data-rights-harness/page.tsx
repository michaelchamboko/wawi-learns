import { notFound } from "next/navigation";
import { DataRightsHarness } from "./harness";

export default function DataRightsHarnessPage() {
  if (process.env.WAWI_E2E_DATA_RIGHTS_HARNESS !== "1") notFound();
  return <DataRightsHarness />;
}
