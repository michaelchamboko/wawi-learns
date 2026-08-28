import { notFound } from "next/navigation";
import { CustomPackHarness } from "./harness";

export default function CustomPackHarnessPage() {
  if (process.env.WAWI_E2E_CUSTOM_PACK_HARNESS !== "1") notFound();
  return <CustomPackHarness />;
}
