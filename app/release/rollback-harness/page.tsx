import { notFound } from "next/navigation";
import { ReleaseRollbackHarness } from "./harness";

export default function ReleaseRollbackHarnessPage() {
  if (process.env.WAWI_E2E_RELEASE_ROLLBACK_HARNESS !== "1") notFound();
  return <ReleaseRollbackHarness />;
}
