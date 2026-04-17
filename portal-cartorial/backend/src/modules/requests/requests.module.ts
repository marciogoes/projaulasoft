import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestEntity } from './entities/request.entity';
import { DocumentProcessor } from './processors/document.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity]),
    BullModule.registerQueue({ name: 'document-generation' }),
  ],
  controllers: [RequestsController],
  providers: [RequestsService, DocumentProcessor],
  exports: [RequestsService],
})
export class RequestsModule {}
