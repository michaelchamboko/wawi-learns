import { StorybookTrail } from "./storybook-trail.tsx";
import { ActivityRenderer } from "./activity-renderer.tsx";
import { Controls } from "./controls.tsx";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <StorybookTrail />
      <ActivityRenderer />
      <Controls />
    </main>
  );
}