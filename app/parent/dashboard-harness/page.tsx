import { notFound } from "next/navigation";
import { ParentDashboardHarness } from "./harness";

export default function ParentDashboardHarnessPage() {
  if (process.env.WAWI_E2E_PARENT_DASHBOARD_HARNESS !== "1") notFound();
  return <ParentDashboardHarness />;
}
