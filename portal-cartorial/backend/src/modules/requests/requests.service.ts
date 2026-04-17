import {
  Injectable, NotFoundException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { RequestEntity, RequestStatus, DocumentType } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';

const DOCUMENT_PRICES: Record<DocumentType, number> = {
  [DocumentType.CERTIDAO_NASCIMENTO]:    45.90,
  [DocumentType.CERTIDAO_CASAMENTO]:     45.90,
  [DocumentType.CERTIDAO_OBITO]:         45.90,
  [DocumentType.RECONHECIMENTO_FIRMA]:   25.50,
  [DocumentType.AUTENTICACAO_DOCUMENTO]: 18.00,
  [DocumentType.PROCURACAO]:             75.00,
};

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,

    @InjectQueue('document-generation')
    private readonly documentQueue: Queue,
  ) {}

  async create(citizenId: string, dto: CreateRequestDto): Promise<RequestEntity> {
    const amount = this.calculateAmount(dto.documentType);

    const request = this.requestsRepository.create({
      citizenId,
      documentType: dto.documentType,
      amount,
      status: RequestStatus.PENDING,
      metadata: dto.metadata,
      notes: dto.notes,
    });

    const saved = await this.requestsRepository.save(request);
    this.logger.log(`Pedido criado: ${saved.id} | Tipo: ${dto.documentType} | Valor: R$${amount}`);
    return saved;
  }

  async findAllByCitizen(
    citizenId: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: RequestEntity[]; total: number; page: number }> {
    const [data, total] = await this.requestsRepository.findAndCount({
      where: { citizenId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page };
  }

  async findOne(id: string, citizenId: string): Promise<RequestEntity> {
    const request = await this.requestsRepository.findOne({ where: { id } });

    if (!request) throw new NotFoundException(`Pedido ${id} nao encontrado`);

    if (request.citizenId !== citizenId) {
      throw new ForbiddenException('Voce nao tem permissao para acessar este pedido');
    }

    return request;
  }

  async updateStatus(
    id: string,
    attendantId: string,
    status: RequestStatus,
  ): Promise<RequestEntity> {
    const request = await this.requestsRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Pedido ${id} nao encontrado`);

    request.status = status;
    request.attendantId = attendantId;

    if (status === RequestStatus.READY) {
      await this.documentQueue.add('generate-pdf', {
        requestId: id,
        documentType: request.documentType,
        metadata: request.metadata,
      });
      this.logger.log(`Job de PDF enfileirado para pedido: ${id}`);
    }

    return this.requestsRepository.save(request);
  }

  private calculateAmount(documentType: DocumentType): number {
    return DOCUMENT_PRICES[documentType] ?? 50.00;
  }
}
