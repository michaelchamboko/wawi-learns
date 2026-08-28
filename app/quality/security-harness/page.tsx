import { notFound } from "next/navigation";
import { QualitySecurityHarness } from "./harness";

export default function QualitySecurityHarnessPage() {
  if (process.env.WAWI_E2E_QUALITY_SECURITY_HARNESS !== "1") notFound();
  return <QualitySecurityHarness />;
}
