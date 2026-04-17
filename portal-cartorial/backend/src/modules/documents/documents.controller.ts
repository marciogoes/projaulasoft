import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { DocumentType } from './entities/document-type.entity';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar servicos cartoriais disponiveis' })
  findAll() { return this.svc.findAll(); }

  @Get(':type')
  @ApiOperation({ summary: 'Detalhes de um tipo de servico cartorial' })
  findOne(@Param('type') type: DocumentType) { return this.svc.findByType(type); }
}
