import { Global, Module } from "@nestjs/common";
import { RefService } from "./ref.service";

@Global()
@Module({
  providers: [RefService],
  exports: [RefService],
})
export class CommonModule {}
