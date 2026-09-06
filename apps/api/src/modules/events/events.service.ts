import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { DomainEventType } from "@nexahaus/types";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Transactional outbox (ARCHITECTURE.md §5.3). A state change appends a
 * DomainEvent row in the SAME transaction as the business write; a worker
 * (Phase 5) polls the outbox and fans out to BullMQ consumers — notifications,
 * statement regeneration, health-score recompute. Callers pass their `tx` so the
 * event and the change commit or roll back together.
 */
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async emit(
    type: DomainEventType,
    payload: Record<string, unknown>,
    tx?: Prisma.TransactionClient,
    dedupeKey?: string,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.domainEvent.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        dedupeKey: dedupeKey ?? null,
      },
    });
  }
}
