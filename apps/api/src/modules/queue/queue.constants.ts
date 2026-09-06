/** BullMQ queue names (ARCHITECTURE.md §5.8). */
export const QUEUE = {
  DOMAIN_EVENT: "domain-event",
} as const;
export type QueueName = (typeof QUEUE)[keyof typeof QUEUE];

export const DOMAIN_EVENT_JOB = "dispatch";
