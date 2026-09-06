import { Global, Module } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { EventConsumer } from "./event-consumer";

@Global()
@Module({
  providers: [QueueService, EventConsumer],
  exports: [QueueService],
})
export class QueueModule {}
