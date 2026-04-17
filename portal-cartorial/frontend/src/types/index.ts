/**
 * types/index.ts — Tipos TypeScript compartilhados
 * Espelha as entidades do backend (C3)
 */

// ── Enums ──────────────────────────────────────────────────────────────────
export type UserRole   = 'cidadao' | 'atendente' | 'admin';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type DocumentType =
  | 'CERTIDAO_NASCIMENTO'
  | 'CERTIDAO_CASAMENTO'
  | 'CERTIDAO_OBITO'
  | 'RECONHECIMENTO_FIRMA'
  | 'AUTENTICACAO_DOCUMENTO'
  | 'PROCURACAO';

export type RequestStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

// ── Entidades ──────────────────────────────────────────────────────────────
export interface User {
  id: string;
  fullName: string;
  email: string;
  cpf?: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTypeItem {
  id: string;
  type: DocumentType;
  name: string;
  description?: string;
  price: number;
  processingDays: number;
  requiredFields: string[];
  isActive: boolean;
}

export interface ServiceRequest {
  id: string;
  citizenId: string;
  attendantId?: string;
  documentType: DocumentType;
  status: RequestStatus;
  amount: number;
  paymentId?: string;
  documentUrl?: string;
  metadata?: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── DTOs (requests) ────────────────────────────────────────────────────────
export interface CreateRequestDto {
  documentType: DocumentType;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ── Responses da API ───────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ── NextAuth session extension ─────────────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: User;
  }
}
