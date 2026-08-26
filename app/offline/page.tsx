import { OfflineEntry } from "./offline-entry";
export const dynamic = "force-static";
export const revalidate = false;

export default function OfflinePage() {
  return <OfflineEntry />;
}
