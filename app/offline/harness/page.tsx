import { notFound } from "next/navigation";
import { OfflineAuthorizationHarness } from "../offline-authorization-harness";

export default function OfflineHarnessPage() {
  if (process.env.WAWI_E2E_OFFLINE_HARNESS !== "1") notFound();
  return <OfflineAuthorizationHarness />;
}
