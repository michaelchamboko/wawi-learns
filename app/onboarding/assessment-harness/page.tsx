import { notFound } from "next/navigation";
import { AssessmentHarness } from "../assessment-harness";

export default function AssessmentHarnessPage() {
  if (process.env.WAWI_E2E_ASSESSMENT_HARNESS !== "1") notFound();
  return <AssessmentHarness />;
}
