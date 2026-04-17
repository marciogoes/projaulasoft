import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum RequestStatus {
  PENDING    = 'PENDING',
  PAID       = 'PAID',
  PROCESSING = 'PROCESSING',
  READY      = 'READY',
  DELIVERED  = 'DELIVERED',
  CANCELLED  = 'CANCELLED',
  REJECTED   = 'REJECTED',
}

export enum DocumentType {
  CERTIDAO_NASCIMENTO    = 'CERTIDAO_NASCIMENTO',
  CERTIDAO_CASAMENTO     = 'CERTIDAO_CASAMENTO',
  CERTIDAO_OBITO         = 'CERTIDAO_OBITO',
  RECONHECIMENTO_FIRMA   = 'RECONHECIMENTO_FIRMA',
  AUTENTICACAO_DOCUMENTO = 'AUTENTICACAO_DOCUMENTO',
  PROCURACAO             = 'PROCURACAO',
}

@Entity('requests')
export class RequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'citizen_id' })
  citizenId: string;

  @Column({ name: 'attendant_id', nullable: true })
  attendantId?: string;

  @Column({ type: 'enum', enum: DocumentType, name: 'document_type' })
  documentType: DocumentType;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'payment_id', nullable: true })
  paymentId?: string;

  @Column({ name: 'document_url', nullable: true })
  documentUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
