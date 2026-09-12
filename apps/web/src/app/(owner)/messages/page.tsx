"use client";

import { MessagesView } from "@/components/messages-view";
import { PageHeader } from "@/components/ui/states";

export default function MessagesPage() {
  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Your direct line to the NexaHaus team."
      />
      <MessagesView />
    </div>
  );
}
