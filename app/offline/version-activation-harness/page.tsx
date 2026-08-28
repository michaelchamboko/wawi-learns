import { notFound } from "next/navigation";
import { VersionActivationHarness } from "./harness";

export default function VersionActivationHarnessPage() {
  if (process.env.WAWI_E2E_VERSION_ACTIVATION_HARNESS !== "1") notFound();
  return <VersionActivationHarness />;
}
