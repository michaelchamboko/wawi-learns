import { notFound } from "next/navigation";
import { AccessibilityHarness } from "./harness";

export default function AccessibilityHarnessPage() {
  if (process.env.WAWI_E2E_ACCESSIBILITY_HARNESS !== "1") notFound();
  return <AccessibilityHarness />;
}
