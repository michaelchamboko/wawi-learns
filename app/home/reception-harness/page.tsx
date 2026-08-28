import { notFound } from "next/navigation";
import { ReceptionHarness } from "./harness";

export default function ReceptionHarnessPage() {
  if (process.env.WAWI_E2E_RECEPTION_HARNESS !== "1") notFound();
  return <ReceptionHarness />;
}
