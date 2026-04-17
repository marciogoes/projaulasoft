import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum DocumentType {
  CERTIDAO_NASCIMENTO    = 'CERTIDAO_NASCIMENTO',
  CERTIDAO_CASAMENTO     = 'CERTIDAO_CASAMENTO',
  CERTIDAO_OBITO         = 'CERTIDAO_OBITO',
  RECONHECIMENTO_FIRMA   = 'RECONHECIMENTO_FIRMA',
  AUTENTICACAO_DOCUMENTO = 'AUTENTICACAO_DOCUMENTO',
  PROCURACAO             = 'PROCURACAO',
}

@Entity('document_types')
export class DocumentTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: DocumentType, unique: true })
  type: DocumentType;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'processing_days', default: 3 })
  processingDays: number;

  @Column({ name: 'required_fields', type: 'jsonb', default: '[]' })
  requiredFields: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
