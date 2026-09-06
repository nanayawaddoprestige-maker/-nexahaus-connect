import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { DocumentScopeService } from "./document-scope.service";

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentScopeService],
  exports: [DocumentsService, DocumentScopeService],
})
export class DocumentsModule {}
