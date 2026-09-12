"use client";

import { MessagesView } from "@/components/messages-view";
import { PageHeader } from "@/components/ui/states";

export default function TenantMessagesPage() {
  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Your channel to the NexaHaus team."
      />
      <MessagesView />
    </div>
  );
}
