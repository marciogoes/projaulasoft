import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentTypeEntity, DocumentType } from './entities/document-type.entity';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(DocumentTypeEntity)
    private readonly repo: Repository<DocumentTypeEntity>,
  ) {}

  async findAll(): Promise<DocumentTypeEntity[]> {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findByType(type: DocumentType): Promise<DocumentTypeEntity> {
    const doc = await this.repo.findOne({ where: { type, isActive: true } });
    if (!doc) throw new NotFoundException(`Tipo de documento '${type}' nao disponivel`);
    return doc;
  }

  async getPrice(type: DocumentType): Promise<number> {
    const doc = await this.findByType(type);
    return Number(doc.price);
  }

  async seedDocumentTypes(): Promise<void> {
    const types = [
      {
        type: DocumentType.CERTIDAO_NASCIMENTO,
        name: 'Certidao de Nascimento',
        description: 'Segunda via da certidao de nascimento',
        price: 45.90,
        processingDays: 3,
        requiredFields: ['nome_requerente', 'cpf_requerente', 'nome_registrado', 'data_nascimento'],
      },
      {
        type: DocumentType.CERTIDAO_CASAMENTO,
        name: 'Certidao de Casamento',
        description: 'Segunda via da certidao de casamento',
        price: 45.90,
        processingDays: 3,
        requiredFields: ['nome_conjuge_1', 'nome_conjuge_2', 'data_casamento'],
      },
      {
        type: DocumentType.CERTIDAO_OBITO,
        name: 'Certidao de Obito',
        description: 'Segunda via da certidao de obito',
        price: 45.90,
        processingDays: 3,
        requiredFields: ['nome_falecido', 'data_obito', 'nome_requerente'],
      },
      {
        type: DocumentType.RECONHECIMENTO_FIRMA,
        name: 'Reconhecimento de Firma',
        description: 'Autenticacao de assinatura em documento',
        price: 25.50,
        processingDays: 1,
        requiredFields: ['nome_signatario', 'tipo_documento'],
      },
      {
        type: DocumentType.AUTENTICACAO_DOCUMENTO,
        name: 'Autenticacao de Documento',
        description: 'Copia autenticada de documento original',
        price: 18.00,
        processingDays: 1,
        requiredFields: ['tipo_documento', 'numero_paginas'],
      },
      {
        type: DocumentType.PROCURACAO,
        name: 'Procuracao',
        description: 'Instrumento de mandato com poderes especificos',
        price: 75.00,
        processingDays: 2,
        requiredFields: ['nome_outorgante', 'cpf_outorgante', 'nome_outorgado', 'poderes'],
      },
    ];

    for (const data of types) {
      const existing = await this.repo.findOne({ where: { type: data.type } });
      if (!existing) {
        await this.repo.save(this.repo.create(data));
        this.logger.log(`Tipo de documento criado: ${data.name}`);
      }
    }
  }
}
