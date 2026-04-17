/**
 * requests.service.spec.ts — Testes unitários do RequestsService
 * Aula 07 — Qualidade e Testes I
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RequestsService } from '../../../modules/requests/requests.service';
import { RequestEntity, RequestStatus, DocumentType } from '../../../modules/requests/entities/request.entity';

const mockRequestsRepository = {
  create:       jest.fn(),
  save:         jest.fn(),
  findOne:      jest.fn(),
  findAndCount: jest.fn(),
  update:       jest.fn(),
};

const mockDocumentQueue = { add: jest.fn() };

const makeRequest = (overrides = {}): RequestEntity => ({
  id: 'req_uuid_001',
  citizenId: 'usr_uuid_001',
  attendantId: undefined,
  documentType: DocumentType.CERTIDAO_NASCIMENTO,
  status: RequestStatus.PENDING,
  amount: 45.90,
  paymentId: undefined,
  documentUrl: undefined,
  metadata: {},
  notes: undefined,
  createdAt: new Date('2026-03-06'),
  updatedAt: new Date('2026-03-06'),
  ...overrides,
});

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(RequestEntity), useValue: mockRequestsRepository },
        { provide: getQueueToken('document-generation'),  useValue: mockDocumentQueue },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('deve criar um pedido com status PENDING e valor correto', async () => {
      const dto = { documentType: DocumentType.CERTIDAO_NASCIMENTO, metadata: { nome: 'Joao' } };
      const expected = makeRequest({ status: RequestStatus.PENDING, amount: 45.90 });
      mockRequestsRepository.create.mockReturnValue(expected);
      mockRequestsRepository.save.mockResolvedValue(expected);

      const result = await service.create('usr_uuid_001', dto);

      expect(result.status).toBe(RequestStatus.PENDING);
      expect(result.amount).toBe(45.90);
      expect(mockRequestsRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne()', () => {
    it('deve retornar pedido quando ID e cidadao batem', async () => {
      const req = makeRequest();
      mockRequestsRepository.findOne.mockResolvedValue(req);

      const result = await service.findOne('req_uuid_001', 'usr_uuid_001');
      expect(result.id).toBe('req_uuid_001');
    });

    it('deve lancar NotFoundException quando pedido nao existe', async () => {
      mockRequestsRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('id_invalido', 'usr_001'))
        .rejects.toThrow(NotFoundException);
    });

    it('deve lancar ForbiddenException quando pedido pertence a outro cidadao', async () => {
      const req = makeRequest({ citizenId: 'outro_usuario' });
      mockRequestsRepository.findOne.mockResolvedValue(req);
      await expect(service.findOne('req_uuid_001', 'usr_uuid_001'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus()', () => {
    it('deve enfileirar job de PDF quando status muda para READY', async () => {
      const req = makeRequest({ status: RequestStatus.PROCESSING });
      mockRequestsRepository.findOne.mockResolvedValue(req);
      mockRequestsRepository.save.mockResolvedValue({ ...req, status: RequestStatus.READY });
      mockDocumentQueue.add.mockResolvedValue({ id: 'job_001' });

      await service.updateStatus('req_uuid_001', 'att_001', RequestStatus.READY);

      expect(mockDocumentQueue.add).toHaveBeenCalledWith(
        'generate-pdf',
        expect.objectContaining({ requestId: 'req_uuid_001' }),
      );
    });

    it('NAO deve enfileirar job quando status e diferente de READY', async () => {
      const req = makeRequest();
      mockRequestsRepository.findOne.mockResolvedValue(req);
      mockRequestsRepository.save.mockResolvedValue({ ...req, status: RequestStatus.PROCESSING });

      await service.updateStatus('req_uuid_001', 'att_001', RequestStatus.PROCESSING);
      expect(mockDocumentQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('findAllByCitizen()', () => {
    it('deve retornar lista paginada de pedidos do cidadao', async () => {
      const requests = [makeRequest(), makeRequest({ id: 'req_002' })];
      mockRequestsRepository.findAndCount.mockResolvedValue([requests, 2]);

      const result = await service.findAllByCitizen('usr_uuid_001', 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });
});
