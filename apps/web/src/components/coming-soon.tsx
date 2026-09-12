import { PageHeader } from "./ui/states";
import { Card } from "./ui/card";

/**
 * Placeholder for owner sections not yet built in this phase. Keeps the app
 * shell navigable end-to-end while the vertical slice is Dashboard → Properties.
 */
export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card className="flex flex-col items-center py-16 text-center">
        <p className="text-sm font-semibold text-navy-900">Coming in {phase}</p>
        <p className="mt-1 max-w-md text-sm text-ink-muted">
          This section is part of the NexaHaus Connect roadmap. The data model
          and API are already in place; the owner-facing screens land in {phase}
          .
        </p>
      </Card>
    </div>
  );
}
