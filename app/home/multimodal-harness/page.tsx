import { notFound } from "next/navigation";
import { MultimodalHarness } from "./harness";

export default function MultimodalHarnessPage() {
  if (process.env.WAWI_E2E_MULTIMODAL_HARNESS !== "1") notFound();
  return <MultimodalHarness />;
}
