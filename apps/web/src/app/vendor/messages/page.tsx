"use client";

import { MessagesView } from "@/components/messages-view";
import { PageHeader } from "@/components/ui/states";

export default function VendorMessagesPage() {
  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Coordinate with the NexaHaus team."
      />
      <MessagesView />
    </div>
  );
}
