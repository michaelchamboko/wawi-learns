import Link from "next/link";
import StorybookTrail from "./storybook-trail";
import ActivityRenderer from "./activity-renderer";
import Controls from "./controls";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <StorybookTrail />
      <ActivityRenderer />
      <Controls />
    </main>
  );
}