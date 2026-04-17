import { IsEnum, IsOptional, IsObject, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../entities/request.entity';

export class CreateRequestDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.CERTIDAO_NASCIMENTO })
  @IsEnum(DocumentType, { message: 'Tipo de documento invalido' })
  documentType: DocumentType;

  @ApiPropertyOptional({ example: { requerente: 'João Silva' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Urgente — preciso até sexta-feira' })
  @IsOptional()
  @IsString()
  notes?: string;
}
